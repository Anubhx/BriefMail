import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getHistory, getEmailDetail } from "@/lib/gmail/fetch";
import { classifyEmail } from "@/lib/ai/classify-pipeline";
import { saveClassifiedEmail } from "@/lib/ai/save-classified-email";

const bodySchema = z.object({
  queue_item_id: z.string().uuid(),
});

function validateN8nSecret(request: NextRequest): boolean {
  return request.headers.get("x-n8n-secret") === process.env.N8N_WEBHOOK_SECRET;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!validateN8nSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { queue_item_id } = parsed.data;
  const db = createServerClient();

  // Step 1: Fetch pending_queue item
  const { data: queueItem, error: queueError } = await db
    .from("pending_queue")
    .select("*, gmail_accounts(id, user_id, tenant_id, access_token, refresh_token, token_expiry, email)")
    .eq("id", queue_item_id)
    .single();

  if (queueError || !queueItem) {
    return NextResponse.json({ error: "queue_item_not_found" }, { status: 404 });
  }

  // Step 2: Mark as processing immediately
  await db
    .from("pending_queue")
    .update({ status: "processing" })
    .eq("id", queue_item_id);

  // Step 3: Get fresh access token via internal refresh endpoint
  const refreshRes = await fetch(
    `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/refresh`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-n8n-secret": process.env.N8N_WEBHOOK_SECRET!,
      },
      body: JSON.stringify({ account_id: queueItem.gmail_account_id }),
    }
  );

  if (!refreshRes.ok) {
    await db
      .from("pending_queue")
      .update({ status: "failed", error_message: "token_refresh_failed" })
      .eq("id", queue_item_id);
    return NextResponse.json({ error: "token_refresh_failed" }, { status: 500 });
  }

  const { access_token: accessToken } = (await refreshRes.json()) as {
    access_token: string;
  };

  const gmailAccount = queueItem.gmail_accounts as {
    user_id: string;
    tenant_id: string;
    email: string;
  };

  // Step 4: Resolve message ID(s)
  let messageIds: string[] = [];
  const rawId = ((queueItem.message_id || queueItem.history_id) as string || "").trim();
  const isNumericHistoryId = /^\d+$/.test(rawId);

  if (isNumericHistoryId) {
    try {
      const historyResult = await getHistory(accessToken, rawId);
      for (const entry of historyResult.history) {
        if (entry.messagesAdded) {
          for (const added of entry.messagesAdded) {
            if (added.message?.id) {
              messageIds.push(added.message.id);
            }
          }
        }
      }
      messageIds = [...new Set(messageIds)];
    } catch (err) {
      console.warn(`getHistory failed for ${rawId}, attempting direct message fetch fallback:`, err);
      messageIds = [rawId];
    }
  } else if (rawId) {
    messageIds = [rawId];
  }

  if (messageIds.length === 0) {
    // If no messages were added in this history event, mark completed
    await db
      .from("pending_queue")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", queue_item_id);

    return NextResponse.json({
      processed_count: 0,
      email_ids: [],
      categories_found: [],
      note: "No new messages found for history id",
    });
  }

  const emailIds: string[] = [];
  const categoriesFound: string[] = [];

  // Steps 5–10: Process and persist each message
  for (const messageId of messageIds) {
    try {
      const parsedMsg = await getEmailDetail(accessToken, messageId);
      const classification = await classifyEmail({
        from_email: parsedMsg.fromEmail,
        from_name: parsedMsg.fromName,
        subject: parsedMsg.subject,
        snippet: parsedMsg.snippet,
        labels: parsedMsg.labels,
        body_preview: parsedMsg.bodyText.slice(0, 500),
      });

      const savedEmailId = await saveClassifiedEmail({
        gmailAccountId: queueItem.gmail_account_id,
        userId: gmailAccount.user_id,
        tenantId: gmailAccount.tenant_id,
        messageId: messageId,
        threadId: parsedMsg.threadId,
        fromEmail: parsedMsg.fromEmail,
        fromName: parsedMsg.fromName,
        toEmail: parsedMsg.toEmail,
        ccEmail: parsedMsg.ccEmail,
        subject: parsedMsg.subject,
        snippet: parsedMsg.snippet,
        bodyText: parsedMsg.bodyText,
        bodyHtml: parsedMsg.bodyHtml,
        receivedAt: parsedMsg.receivedAt,
        labels: parsedMsg.labels,
        classification: classification,
        queueItemId: queue_item_id,
      });

      if (savedEmailId) {
        emailIds.push(savedEmailId);
        categoriesFound.push(classification.category);
      }
    } catch (msgErr) {
      console.error(`Failed to process message ${messageId}:`, msgErr);
      // Continue processing others
    }
  }

  // Step 11: Mark queue item complete
  await db
    .from("pending_queue")
    .update({
      status: emailIds.length > 0 || messageIds.length === 0 ? "completed" : "failed",
      processed_at: new Date().toISOString(),
      error_message: emailIds.length === 0 && messageIds.length > 0 ? "Failed to parse/classify messages" : null,
    })
    .eq("id", queue_item_id);

  return NextResponse.json({
    processed_count: emailIds.length,
    email_ids: emailIds,
    categories_found: [...new Set(categoriesFound)],
  });
}

