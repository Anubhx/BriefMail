import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getHistory, getEmailDetail } from "@/lib/gmail/fetch";
import { classifyEmail } from "@/lib/ai/classify-pipeline";

const bodySchema = z.object({
  queue_item_id: z.string().uuid(),
});

function validateN8nSecret(request: NextRequest): boolean {
  return request.headers.get("x-n8n-secret") === process.env.N8N_WEBHOOK_SECRET;
}

// ── DB Helpers ────────────────────────────────────────────────────────────────

async function insertFinancialData(
  emailId: string,
  userId: string,
  tenantId: string,
  category: string,
  subcategory: string,
  extractedData: Record<string, unknown>
): Promise<void> {
  const db = createServerClient();
  const table =
    category === "investments" ||
    ["sip_confirmation", "sip_statement", "stock_purchase", "portfolio_update"]
      .includes(subcategory)
      ? "sip_entries"
      : "bank_transactions";

  if (table === "bank_transactions") {
    await db.from("bank_transactions").upsert({
      email_id: emailId,
      user_id: userId,
      tenant_id: tenantId,
      subcategory,
      amount: extractedData.amount ?? null,
      bank_name: extractedData.bank_name ?? null,
      payment_mode: extractedData.payment_mode ?? null,
      transaction_date: extractedData.transaction_date ?? null,
      merchant: extractedData.merchant ?? null,
    });
  } else {
    await db.from("sip_entries").upsert({
      email_id: emailId,
      user_id: userId,
      tenant_id: tenantId,
      subcategory,
      fund_name: extractedData.fund_name ?? null,
      sip_amount: extractedData.sip_amount ?? null,
      nav: extractedData.nav ?? null,
      units: extractedData.units ?? null,
    });
  }
}

async function insertMeetingData(
  emailId: string,
  userId: string,
  tenantId: string,
  extractedData: Record<string, unknown>
): Promise<void> {
  const db = createServerClient();
  await db.from("meetings").upsert({
    email_id: emailId,
    user_id: userId,
    tenant_id: tenantId,
    meeting_time: extractedData.meeting_time ?? null,
    meeting_link: extractedData.meeting_link ?? null,
    platform: extractedData.platform ?? null,
  });
}

async function insertCareerData(
  emailId: string,
  userId: string,
  tenantId: string,
  subcategory: string,
  extractedData: Record<string, unknown>
): Promise<void> {
  const db = createServerClient();
  await db.from("job_applications").upsert({
    email_id: emailId,
    user_id: userId,
    tenant_id: tenantId,
    subcategory,
    company: extractedData.company ?? null,
    role: extractedData.role ?? null,
    salary_lpa: extractedData.salary_lpa ?? null,
    joining_date: extractedData.joining_date ?? null,
    portfolio_links: extractedData.portfolio_links ?? [],
  });
}

// ── Route ─────────────────────────────────────────────────────────────────────

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
    .eq("status", "pending")
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
      .update({ status: "failed" })
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

  // Step 4: The queue message_id is a historyId — resolve to actual message IDs
  let messageIds: string[] = [];
  try {
    const historyResult = await getHistory(accessToken, queueItem.message_id as string);
    for (const entry of historyResult.history) {
      if (entry.messagesAdded) {
        for (const added of entry.messagesAdded) {
          messageIds.push(added.message.id);
        }
      }
    }
    messageIds = [...new Set(messageIds)];
  } catch (err) {
    const msg = err instanceof Error ? err.message : "history_fetch_failed";
    await db
      .from("pending_queue")
      .update({ status: "failed" })
      .eq("id", queue_item_id);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const emailIds: string[] = [];
  const categoriesFound: string[] = [];

  // Steps 5–10: Process each message
  for (const messageId of messageIds) {
    try {
      const parsed = await getEmailDetail(accessToken, messageId);
      const classification = await classifyEmail({
        from_email: parsed.fromEmail,
        from_name: parsed.fromName,
        subject: parsed.subject,
        snippet: parsed.snippet,
        labels: parsed.labels,
        body_preview: parsed.bodyText.slice(0, 500),
      });

      const { data: insertedEmail } = await db
        .from("emails")
        .upsert({
          gmail_account_id: queueItem.gmail_account_id,
          user_id: gmailAccount.user_id,
          tenant_id: gmailAccount.tenant_id,
          message_id: messageId,
          thread_id: parsed.threadId,
          subject: parsed.subject,
          from_email: parsed.fromEmail,
          from_name: parsed.fromName,
          to_email: parsed.toEmail,
          cc_email: parsed.ccEmail,
          received_at: parsed.receivedAt.toISOString(),
          snippet: parsed.snippet,
          body_text: parsed.bodyText,
          body_html: parsed.bodyHtml,
          labels: parsed.labels,
          category: classification.category,
          subcategory: classification.subcategory,
          confidence: classification.confidence,
          classification_tier: classification.tier,
          ai_summary: classification.ai_summary ?? null,
          extracted_data: classification.extracted_data ?? null,
          has_action_item: classification.has_action_item,
        }, { onConflict: "gmail_account_id,message_id" })
        .select("id")
        .single();

      if (insertedEmail?.id) {
        emailIds.push(insertedEmail.id as string);
        categoriesFound.push(classification.category);

        const extData = classification.extracted_data ?? {};

        if (["finance", "investments"].includes(classification.category)) {
          await insertFinancialData(insertedEmail.id as string, gmailAccount.user_id, gmailAccount.tenant_id, classification.category, classification.subcategory, extData);
        }
        if (classification.category === "meetings") {
          await insertMeetingData(insertedEmail.id as string, gmailAccount.user_id, gmailAccount.tenant_id, extData);
        }
        if (["career", "jobs"].includes(classification.category)) {
          await insertCareerData(insertedEmail.id as string, gmailAccount.user_id, gmailAccount.tenant_id, classification.subcategory, extData);
        }
        if (classification.has_action_item && classification.action_items?.length) {
          for (const item of classification.action_items) {
            await db.from("action_items").insert({
              email_id: insertedEmail.id,
              user_id: gmailAccount.user_id,
              tenant_id: gmailAccount.tenant_id,
              type: item.type,
              description: item.description,
              due_date: item.due_date ?? null,
            });
          }
        }
      }
    } catch {
      // Individual message failure — continue processing others
    }
  }

  // Step 11: Mark queue item complete
  await db
    .from("pending_queue")
    .update({
      status: "completed",
      processed_at: new Date().toISOString(),
    })
    .eq("id", queue_item_id);

  return NextResponse.json({
    processed_count: emailIds.length,
    email_ids: emailIds,
    categories_found: [...new Set(categoriesFound)],
  });
}
