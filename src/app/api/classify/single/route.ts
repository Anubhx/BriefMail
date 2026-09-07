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
  console.log("[classify/single] === Incoming request ===");

  if (!validateN8nSecret(request)) {
    console.warn("[classify/single] Unauthorized request: secret mismatch or missing header");
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
    console.log("[classify/single] Request body:", JSON.stringify(body));
  } catch (err) {
    console.error("[classify/single] Invalid JSON body:", err);
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    console.warn("[classify/single] Body validation failed:", parsed.error.flatten());
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { queue_item_id } = parsed.data;
  console.log(`[classify/single] Processing queue_item_id: ${queue_item_id}`);
  const db = createServerClient();

  // Step 1: Fetch pending_queue item
  console.log(`[classify/single] [Step 1] Fetching pending_queue item with gmail_accounts join...`);
  const { data: queueItem, error: queueError } = await db
    .from("pending_queue")
    .select("*, gmail_accounts(id, user_id, tenant_id, access_token, refresh_token, token_expiry, email)")
    .eq("id", queue_item_id)
    .single();

  console.log("[classify/single] [Step 1] Queue item fetch result:", {
    queue_item_id,
    found: !!queueItem,
    error: queueError ? { message: queueError.message, code: queueError.code, details: queueError.details } : null,
    gmail_account_id: queueItem?.gmail_account_id,
    message_id: queueItem?.message_id,
    history_id: queueItem?.history_id,
    status: queueItem?.status,
    arrived_at: queueItem?.arrived_at,
  });

  if (queueError || !queueItem) {
    console.error("[classify/single] [Step 1] Queue item not found or query error:", queueError);
    return NextResponse.json({ error: "queue_item_not_found", details: queueError }, { status: 404 });
  }

  // Handle both array and object shapes from Supabase join
  const rawAccounts = queueItem.gmail_accounts;
  const gmailAccount = (Array.isArray(rawAccounts) ? rawAccounts[0] : rawAccounts) as {
    id?: string;
    user_id: string;
    tenant_id: string;
    email: string;
    access_token?: string;
    refresh_token?: string;
    token_expiry?: string;
  } | null;

  console.log("[classify/single] [Step 2] Gmail account lookup result:", {
    rawAccountsType: Array.isArray(rawAccounts) ? "array" : typeof rawAccounts,
    found: !!gmailAccount,
    account_id: gmailAccount?.id ?? queueItem.gmail_account_id,
    user_id: gmailAccount?.user_id,
    tenant_id: gmailAccount?.tenant_id,
    email: gmailAccount?.email,
    has_encrypted_access_token: !!gmailAccount?.access_token,
    has_encrypted_refresh_token: !!gmailAccount?.refresh_token,
    token_expiry: gmailAccount?.token_expiry,
  });

  if (!gmailAccount) {
    console.error(`[classify/single] [Step 2] gmail_accounts record not found for account_id: ${queueItem.gmail_account_id}`);
    await db
      .from("pending_queue")
      .update({ status: "failed", error_message: "gmail_account_not_found" })
      .eq("id", queue_item_id);
    return NextResponse.json({ error: "gmail_account_not_found" }, { status: 404 });
  }

  // Step 2: Mark as processing immediately
  console.log(`[classify/single] Marking queue item ${queue_item_id} as processing`);
  await db
    .from("pending_queue")
    .update({ status: "processing" })
    .eq("id", queue_item_id);

  // Step 3: Get fresh access token via internal refresh endpoint
  const refreshUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/gmail/refresh`;
  console.log(`[classify/single] [Step 3] Fetching refreshed token from: ${refreshUrl} for account ${queueItem.gmail_account_id}`);

  let refreshRes: Response;
  try {
    refreshRes = await fetch(refreshUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-n8n-secret": process.env.N8N_WEBHOOK_SECRET!,
      },
      body: JSON.stringify({ account_id: queueItem.gmail_account_id }),
    });
  } catch (fetchErr) {
    console.error("[classify/single] [Step 3] Network error calling /api/gmail/refresh:", fetchErr);
    await db
      .from("pending_queue")
      .update({ status: "failed", error_message: "token_refresh_network_error" })
      .eq("id", queue_item_id);
    return NextResponse.json(
      { error: "token_refresh_network_error", details: String(fetchErr) },
      { status: 500 }
    );
  }

  console.log(`[classify/single] [Step 3] /api/gmail/refresh status: ${refreshRes.status} ${refreshRes.statusText}`);

  if (!refreshRes.ok) {
    const errText = await refreshRes.text();
    console.error(`[classify/single] [Step 3] Token refresh failed with status ${refreshRes.status}:`, errText);
    await db
      .from("pending_queue")
      .update({ status: "failed", error_message: `token_refresh_failed: ${errText}` })
      .eq("id", queue_item_id);
    return NextResponse.json({ error: "token_refresh_failed", details: errText }, { status: 500 });
  }

  const refreshData = (await refreshRes.json()) as { access_token: string; email?: string };
  const accessToken = refreshData.access_token;
  console.log("[classify/single] [Step 3] Token refresh successful. Decrypted access token length:", accessToken?.length, "prefix:", accessToken?.slice(0, 10));

  if (!accessToken) {
    console.error("[classify/single] [Step 3] Token refresh returned no access_token");
    await db
      .from("pending_queue")
      .update({ status: "failed", error_message: "empty_access_token" })
      .eq("id", queue_item_id);
    return NextResponse.json({ error: "empty_access_token" }, { status: 500 });
  }

  // Step 4: Resolve message ID(s)
  let messageIds: string[] = [];
  const rawId = ((queueItem.message_id || queueItem.history_id) as string || "").trim();
  const isNumericHistoryId = /^\d+$/.test(rawId);
  console.log(`[classify/single] [Step 4] Resolving IDs - rawId: '${rawId}', isNumericHistoryId: ${isNumericHistoryId}`);

  if (isNumericHistoryId) {
    try {
      console.log(`[classify/single] [Step 4] Calling getHistory for historyId: ${rawId}...`);
      const historyResult = await getHistory(accessToken, rawId);
      console.log(`[classify/single] [Step 4] getHistory returned ${historyResult.history?.length ?? 0} history records`);
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
      console.log(`[classify/single] [Step 4] Resolved from history: ${messageIds.length} message IDs:`, messageIds);
    } catch (err) {
      console.warn(`[classify/single] [Step 4] getHistory failed for ${rawId}, attempting direct message fetch fallback:`, err);
      messageIds = [rawId];
    }
  } else if (rawId) {
    messageIds = [rawId];
  }

  console.log(`[classify/single] [Step 4] Final messageIds to process (${messageIds.length}):`, messageIds);

  if (messageIds.length === 0) {
    console.log(`[classify/single] [Step 4] No messages to process for queue item ${queue_item_id}. Marking completed.`);
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
  const debugErrors: Array<{ messageId: string; step: string; error: string; stack?: string }> = [];

  // Steps 5–10: Process and persist each message
  for (const messageId of messageIds) {
    console.log(`[classify/single] ── Processing message ${messageId} ──`);
    try {
      // Step 5: getEmailDetail
      console.log(`[classify/single] [Step 5] Calling getEmailDetail(accessToken, ${messageId})...`);
      const parsedMsg = await getEmailDetail(accessToken, messageId);
      console.log(`[classify/single] [Step 5] getEmailDetail success for ${messageId}:`, {
        fromEmail: parsedMsg.fromEmail,
        fromName: parsedMsg.fromName,
        subject: parsedMsg.subject,
        snippet: parsedMsg.snippet ? `${parsedMsg.snippet.slice(0, 80)}...` : "(empty)",
        bodyTextLength: parsedMsg.bodyText?.length ?? 0,
        bodyHtmlLength: parsedMsg.bodyHtml?.length ?? 0,
        labels: parsedMsg.labels,
        receivedAt: parsedMsg.receivedAt,
      });

      // Step 6: classifyEmail
      console.log(`[classify/single] [Step 6] Calling classifyEmail for ${messageId}...`);
      const classification = await classifyEmail({
        from_email: parsedMsg.fromEmail,
        from_name: parsedMsg.fromName,
        subject: parsedMsg.subject,
        snippet: parsedMsg.snippet,
        labels: parsedMsg.labels,
        body_preview: parsedMsg.bodyText.slice(0, 500),
      });

      console.log(`[classify/single] [Step 6] classifyEmail returned for ${messageId}:`, {
        category: classification.category,
        subcategory: classification.subcategory,
        confidence: classification.confidence,
        tier: classification.tier,
        has_action_item: classification.has_action_item,
        deferred: classification.deferred,
        summary: classification.ai_summary,
      });

      // Step 7: saveClassifiedEmail
      console.log(`[classify/single] [Step 7] Calling saveClassifiedEmail for ${messageId}...`);
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
        receivedAt: parsedMsg.receivedAt,
        labels: parsedMsg.labels,
        classification: classification,
        queueItemId: queue_item_id,
      });

      console.log(`[classify/single] [Step 7] saveClassifiedEmail returned: ${savedEmailId}`);

      if (savedEmailId) {
        emailIds.push(savedEmailId);
        categoriesFound.push(classification.category);
      } else {
        console.warn(`[classify/single] [Step 7] saveClassifiedEmail returned null/falsy for message ${messageId}! (Check emails table insert)`);
        debugErrors.push({
          messageId,
          step: "saveClassifiedEmail",
          error: "saveClassifiedEmail returned null (database upsert failed)",
        });
      }
    } catch (msgErr) {
      const errMessage = msgErr instanceof Error ? msgErr.message : String(msgErr);
      const errStack = msgErr instanceof Error ? msgErr.stack : undefined;
      console.error(`[classify/single] ERROR processing message ${messageId}:`, {
        error: errMessage,
        stack: errStack,
      });
      debugErrors.push({
        messageId,
        step: "process_message_catch",
        error: errMessage,
        stack: errStack,
      });
      // Continue processing others
    }
  }

  // Step 11: Mark queue item complete / failed
  const finalStatus = emailIds.length > 0 || messageIds.length === 0 ? "completed" : "failed";
  const finalErrorMessage =
    emailIds.length === 0 && messageIds.length > 0
      ? debugErrors.length > 0
        ? `Failed: ${debugErrors.map((e) => `[${e.step}] ${e.error}`).join("; ")}`
        : "Failed to parse/classify messages"
      : null;

  console.log(`[classify/single] [Step 11] Updating pending_queue status to '${finalStatus}', error_message: '${finalErrorMessage}'`);

  await db
    .from("pending_queue")
    .update({
      status: finalStatus,
      processed_at: new Date().toISOString(),
      error_message: finalErrorMessage,
    })
    .eq("id", queue_item_id);

  console.log("[classify/single] === Done ===", {
    processed_count: emailIds.length,
    email_ids: emailIds,
    categories_found: categoriesFound,
    errors_count: debugErrors.length,
  });

  return NextResponse.json({
    processed_count: emailIds.length,
    email_ids: emailIds,
    categories_found: [...new Set(categoriesFound)],
    ...(debugErrors.length > 0 ? { debug_errors: debugErrors } : {}),
  });
}


