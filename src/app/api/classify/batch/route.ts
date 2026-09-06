import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getEmailDetail } from "@/lib/gmail/fetch";
import { classifyEmail } from "@/lib/ai/classify-pipeline";
import { refreshAccessToken } from "@/lib/gmail/tokens";

const bodySchema = z.object({
  account_id: z.string().uuid(),
  message_ids: z.array(z.string()).min(1).max(50),
});

const BATCH_SIZE = 20;

function validateN8nSecret(request: NextRequest): boolean {
  return request.headers.get("x-n8n-secret") === process.env.N8N_WEBHOOK_SECRET;
}

// ── DB Helpers (same as classify/single) ─────────────────────────────────────

async function insertFinancialData(
  emailId: string,
  userId: string,
  tenantId: string,
  category: string,
  subcategory: string,
  extractedData: Record<string, unknown>
): Promise<void> {
  const db = createServerClient();
  const isInvestment =
    category === "investments" ||
    ["sip_confirmation", "sip_statement", "stock_purchase", "portfolio_update"].includes(subcategory);

  if (isInvestment) {
    await db.from("sip_entries").upsert({
      email_id: emailId, user_id: userId, tenant_id: tenantId, subcategory,
      fund_name: extractedData.fund_name ?? null,
      sip_amount: extractedData.sip_amount ?? null,
      nav: extractedData.nav ?? null,
      units: extractedData.units ?? null,
    });
  } else {
    await db.from("bank_transactions").upsert({
      email_id: emailId, user_id: userId, tenant_id: tenantId, subcategory,
      amount: extractedData.amount ?? null,
      bank_name: extractedData.bank_name ?? null,
      payment_mode: extractedData.payment_mode ?? null,
      transaction_date: extractedData.transaction_date ?? null,
      merchant: extractedData.merchant ?? null,
    });
  }
}

async function insertMeetingData(
  emailId: string, userId: string, tenantId: string,
  extractedData: Record<string, unknown>
): Promise<void> {
  const db = createServerClient();
  await db.from("meetings").upsert({
    email_id: emailId, user_id: userId, tenant_id: tenantId,
    meeting_time: extractedData.meeting_time ?? null,
    meeting_link: extractedData.meeting_link ?? null,
    platform: extractedData.platform ?? null,
  });
}

async function insertCareerData(
  emailId: string, userId: string, tenantId: string,
  subcategory: string, extractedData: Record<string, unknown>
): Promise<void> {
  const db = createServerClient();
  await db.from("job_applications").upsert({
    email_id: emailId, user_id: userId, tenant_id: tenantId, subcategory,
    company: extractedData.company ?? null,
    role: extractedData.role ?? null,
    salary_lpa: extractedData.salary_lpa ?? null,
    joining_date: extractedData.joining_date ?? null,
    portfolio_links: extractedData.portfolio_links ?? [],
  });
}

// ── Single message processor ──────────────────────────────────────────────────

async function processMessage(
  accessToken: string,
  messageId: string,
  gmailAccountId: string,
  userId: string,
  tenantId: string
): Promise<{ message_id: string; category: string; tier: string }> {
  const db = createServerClient();

  // Skip already-processed
  const { data: existing } = await db
    .from("emails")
    .select("id")
    .eq("gmail_account_id", gmailAccountId)
    .eq("message_id", messageId)
    .maybeSingle();

  if (existing) {
    return { message_id: messageId, category: "skipped", tier: "none" };
  }

  const parsed = await getEmailDetail(accessToken, messageId);
  const classification = await classifyEmail({
    from_email: parsed.fromEmail,
    from_name: parsed.fromName,
    subject: parsed.subject,
    snippet: parsed.snippet,
    labels: parsed.labels,
    body_preview: parsed.bodyText.slice(0, 500),
  });

  const { data: inserted } = await db
    .from("emails")
    .upsert({
      gmail_account_id: gmailAccountId,
      user_id: userId,
      tenant_id: tenantId,
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

  if (inserted?.id) {
    const id = inserted.id as string;
    const ext = classification.extracted_data ?? {};

    if (["finance", "investments"].includes(classification.category)) {
      await insertFinancialData(id, userId, tenantId, classification.category, classification.subcategory, ext);
    }
    if (classification.category === "meetings") {
      await insertMeetingData(id, userId, tenantId, ext);
    }
    if (["career", "jobs"].includes(classification.category)) {
      await insertCareerData(id, userId, tenantId, classification.subcategory, ext);
    }
    if (classification.has_action_item && classification.action_items?.length) {
      const db2 = createServerClient();
      for (const item of classification.action_items) {
        await db2.from("action_items").insert({
          email_id: id, user_id: userId, tenant_id: tenantId,
          type: item.type, description: item.description, due_date: item.due_date ?? null,
        });
      }
    }
  }

  return { message_id: messageId, category: classification.category, tier: classification.tier };
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

  const parsedBody = bodySchema.safeParse(body);
  if (!parsedBody.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsedBody.error.flatten() },
      { status: 400 }
    );
  }

  const { account_id, message_ids } = parsedBody.data;
  const db = createServerClient();

  const { data: account, error: accountError } = await db
    .from("gmail_accounts")
    .select("id, user_id, tenant_id, refresh_token")
    .eq("id", account_id)
    .single();

  if (accountError || !account) {
    return NextResponse.json({ error: "account_not_found" }, { status: 404 });
  }

  // Get fresh access token
  let accessToken: string;
  try {
    const refreshed = await refreshAccessToken(account.refresh_token as string);
    accessToken = refreshed.access_token;

    await db
      .from("gmail_accounts")
      .update({ access_token: refreshed.encrypted_access_token, token_expiry: refreshed.expiry.toISOString() })
      .eq("id", account_id);
  } catch {
    return NextResponse.json({ error: "token_refresh_failed" }, { status: 500 });
  }

  const results: { message_id: string; category: string; tier: string }[] = [];
  let processed = 0;
  let failed = 0;

  // Process in batches of 20
  for (let i = 0; i < message_ids.length; i += BATCH_SIZE) {
    const batch = message_ids.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(
      batch.map((msgId) =>
        processMessage(accessToken, msgId, account_id, account.user_id as string, account.tenant_id as string)
      )
    );

    for (const result of settled) {
      if (result.status === "fulfilled") {
        results.push(result.value);
        processed++;
      } else {
        failed++;
      }
    }
  }

  return NextResponse.json({ processed, failed, results });
}
