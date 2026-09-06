import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getEmailDetail, getHistory } from "@/lib/gmail/fetch";
import { decryptToken, refreshAccessToken } from "@/lib/gmail/tokens";
import { classifyEmail } from "@/lib/ai/classify-pipeline";
import { saveClassifiedEmail } from "@/lib/ai/save-classified-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function validateN8nSecret(request: NextRequest): boolean {
  return request.headers.get("x-n8n-secret") === process.env.N8N_WEBHOOK_SECRET;
}

interface AccountRecord {
  id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  access_token?: string;
  refresh_token?: string;
  token_expiry?: string;
}

interface QueueRow {
  id: string;
  gmail_account_id: string;
  tenant_id?: string;
  message_id: string;
  history_id?: string;
  arrived_at?: string;
  gmail_accounts?: AccountRecord | AccountRecord[] | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Validate secret
  if (!validateN8nSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServerClient();

  // 2. Select 50 pending items
  const { data: rawRows, error: selectErr } = await db
    .from("pending_queue")
    .select(
      "id, gmail_account_id, tenant_id, message_id, history_id, arrived_at, gmail_accounts(id, user_id, tenant_id, access_token, refresh_token, token_expiry, email)"
    )
    .eq("status", "pending")
    .order("arrived_at", { ascending: true })
    .limit(50);

  if (selectErr) {
    console.error("[queue/drain] Database select error:", selectErr);
    return NextResponse.json(
      { error: "db_query_failed", details: selectErr.message },
      { status: 500 }
    );
  }

  const rows = (rawRows || []) as unknown as QueueRow[];

  if (rows.length === 0) {
    const { count: remainingCount } = await db
      .from("pending_queue")
      .select("*", { count: "exact", head: true })
      .eq("status", "pending");

    return NextResponse.json({
      processed: 0,
      failed: 0,
      remaining_count: remainingCount ?? 0,
      remaining: remainingCount ?? 0,
    });
  }

  // 3. Mark selected rows as 'processing' so parallel drain calls don't pick them
  const rowIds = rows.map((r) => r.id);
  await db
    .from("pending_queue")
    .update({ status: "processing" })
    .in("id", rowIds);

  const tokenPromises = new Map<string, Promise<string | null>>();

  function getAccessToken(account: AccountRecord): Promise<string | null> {
    const existing = tokenPromises.get(account.id);
    if (existing) return existing;

    const promise = (async () => {
      try {
        const expiry = account.token_expiry ? new Date(account.token_expiry) : null;
        const isExpired = !expiry || expiry.getTime() <= Date.now() + 2 * 60 * 1000;

        if (!isExpired && account.access_token) {
          const decrypted = decryptToken(account.access_token);
          if (decrypted) return decrypted;
        }

        if (account.refresh_token) {
          const refreshed = await refreshAccessToken(account.refresh_token);
          if (refreshed?.access_token) {
            await db
              .from("gmail_accounts")
              .update({
                access_token: refreshed.encrypted_access_token,
                token_expiry: refreshed.expiry.toISOString(),
              })
              .eq("id", account.id);

            return refreshed.access_token;
          }
        }
      } catch (err) {
        console.warn(`[queue/drain] Token refresh error for account ${account.id}:`, err);
      }

      if (account.access_token) {
        try {
          const decrypted = decryptToken(account.access_token);
          if (decrypted) return decrypted;
        } catch {}
      }

      return null;
    })();

    tokenPromises.set(account.id, promise);
    return promise;
  }

  async function processRow(row: QueueRow): Promise<boolean> {
    const rawAccount = row.gmail_accounts;
    let account = (Array.isArray(rawAccount) ? rawAccount[0] : rawAccount) as AccountRecord | null;

    if (!account) {
      const { data: fetchedAccount } = await db
        .from("gmail_accounts")
        .select("id, user_id, tenant_id, access_token, refresh_token, token_expiry, email")
        .eq("id", row.gmail_account_id)
        .single();
      if (fetchedAccount) {
        account = fetchedAccount as AccountRecord;
      }
    }

    if (!account) {
      await db
        .from("pending_queue")
        .update({
          status: "failed",
          error_message: "gmail_account_not_found",
          processed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return false;
    }

    const accessToken = await getAccessToken(account);
    if (!accessToken) {
      await db
        .from("pending_queue")
        .update({
          status: "failed",
          error_message: "token_unavailable",
          processed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return false;
    }

    const rawId = ((row.message_id || row.history_id) as string || "").trim();
    const isNumericHistoryId = /^\d+$/.test(rawId);
    let messageIds: string[] = [];

    if (isNumericHistoryId) {
      try {
        const historyResult = await getHistory(accessToken, rawId, { maxResults: 5 });
        for (const entry of historyResult.history || []) {
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
        console.warn(`[queue/drain] getHistory failed for historyId ${rawId}:`, err);
      }
    } else if (rawId) {
      messageIds = [rawId];
    }

    if (messageIds.length === 0) {
      await db
        .from("pending_queue")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return true;
    }

    let atLeastOneSuccess = false;
    let lastError: string | null = null;

    for (const msgId of messageIds) {
      try {
        const parsedMsg = await getEmailDetail(accessToken, msgId);
        const classification = await classifyEmail({
          from_email: parsedMsg.fromEmail,
          from_name: parsedMsg.fromName,
          subject: parsedMsg.subject,
          snippet: parsedMsg.snippet,
          labels: parsedMsg.labels,
          body_preview: parsedMsg.bodyText?.slice(0, 500) || "",
        });

        await saveClassifiedEmail({
          gmailAccountId: account.id,
          userId: account.user_id,
          tenantId: account.tenant_id,
          messageId: msgId,
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
          queueItemId: row.id,
        });

        atLeastOneSuccess = true;
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err);
        console.error(`[queue/drain] Error classifying message ${msgId}:`, err);
      }
    }

    const finalStatus = atLeastOneSuccess || messageIds.length === 0 ? "processed" : "failed";
    await db
      .from("pending_queue")
      .update({
        status: finalStatus,
        processed_at: new Date().toISOString(),
        error_message: finalStatus === "failed" ? lastError : null,
      })
      .eq("id", row.id);

    return atLeastOneSuccess || messageIds.length === 0;
  }

  // 4. Process all selected rows concurrently in parallel with Promise.allSettled
  const results = await Promise.allSettled(rows.map((row) => processRow(row)));

  let processedCount = 0;
  let failedCount = 0;

  for (const res of results) {
    if (res.status === "fulfilled" && res.value === true) {
      processedCount++;
    } else {
      failedCount++;
    }
  }

  // 5. Query remaining count
  const { count: remainingCount } = await db
    .from("pending_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return NextResponse.json({
    processed: processedCount,
    failed: failedCount,
    remaining_count: remainingCount ?? 0,
    remaining: remainingCount ?? 0,
  });
}
