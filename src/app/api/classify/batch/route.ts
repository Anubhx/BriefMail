import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getEmailDetail } from "@/lib/gmail/fetch";
import { classifyEmail } from "@/lib/ai/classify-pipeline";
import { refreshAccessToken } from "@/lib/gmail/tokens";

import { saveClassifiedEmail } from "@/lib/ai/save-classified-email";

const bodySchema = z.object({
  account_id: z.string().uuid(),
  message_ids: z.array(z.string()).min(1).max(50),
});

const BATCH_SIZE = 20;

function validateN8nSecret(request: NextRequest): boolean {
  return request.headers.get("x-n8n-secret") === process.env.N8N_WEBHOOK_SECRET;
}

// ── Single message processor ──────────────────────────────────────────────────

async function processMessage(
  accessToken: string,
  messageId: string,
  gmailAccountId: string,
  userId: string,
  tenantId: string
): Promise<{ message_id: string; category: string; tier: string; email_id: string | null }> {
  const db = createServerClient();

  // Check if already processed
  const { data: existing } = await db
    .from("emails")
    .select("id, category, classification_tier")
    .eq("gmail_account_id", gmailAccountId)
    .eq("message_id", messageId)
    .maybeSingle();

  if (existing?.id) {
    return {
      message_id: messageId,
      category: existing.category ?? "skipped",
      tier: existing.classification_tier ?? "none",
      email_id: existing.id,
    };
  }

  const parsedMsg = await getEmailDetail(accessToken, messageId);
  const classification = await classifyEmail({
    from_email: parsedMsg.fromEmail,
    from_name: parsedMsg.fromName,
    subject: parsedMsg.subject,
    snippet: parsedMsg.snippet,
    labels: parsedMsg.labels,
    body_preview: parsedMsg.bodyText.slice(0, 500),
  });

  const savedId = await saveClassifiedEmail({
    gmailAccountId,
    userId,
    tenantId,
    messageId,
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
    classification,
  });

  return {
    message_id: messageId,
    category: classification.category,
    tier: classification.tier,
    email_id: savedId,
  };
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
