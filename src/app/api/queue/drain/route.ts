import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getEmailDetail, getHistory } from "@/lib/gmail/fetch";
import { decryptToken, refreshAccessToken } from "@/lib/gmail/tokens";
import { classifyEmail } from "@/lib/ai/classify-pipeline";
import { saveClassifiedEmail } from "@/lib/ai/save-classified-email";

export const dynamic = "force-dynamic";
export const maxDuration = 60; // Allow up to 60s for draining 20 emails

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
  tenant_id: string;
  message_id: string;
  history_id?: string;
  arrived_at: string;
  gmail_accounts?: AccountRecord | AccountRecord[] | null;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // 1. Validate secret
  if (!validateN8nSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServerClient();

  // 2. Select 20 pending items ordered by arrived_at ASC
  const { data: rawRows, error: selectErr } = await db
    .from("pending_queue")
    .select(
      "id, gmail_account_id, tenant_id, message_id, history_id, arrived_at, gmail_accounts(id, user_id, tenant_id, access_token, refresh_token, token_expiry, email)"
    )
    .eq("status", "pending")
    .order("arrived_at", { ascending: true })
    .limit(20);

  if (selectErr) {
    console.error("[queue/drain] Database select error:", selectErr);
    return NextResponse.json(
      { error: "db_query_failed", details: selectErr.message },
      { status: 500 }
    );
  }

  const rows = (rawRows || []) as unknown as QueueRow[];

  if (rows.length === 0) {
    // Queue is empty
    return NextResponse.json({
      processed: 0,
      remaining: 0,
    });
  }

  // 3. Mark selected rows as 'processing' so parallel drain workers don't grab them
  const rowIds = rows.map((r) => r.id);
  await db
    .from("pending_queue")
    .update({ status: "processing" })
    .in("id", rowIds);

  // Cache access tokens per account across the batch to minimize Google OAuth refreshes
  const tokenCache = new Map<string, string>();

  async function getAccessToken(account: AccountRecord): Promise<string | null> {
    if (tokenCache.has(account.id)) {
      return tokenCache.get(account.id)!;
    }

    try {
      const expiry = account.token_expiry ? new Date(account.token_expiry) : null;
      const isExpired = !expiry || expiry.getTime() <= Date.now() + 2 * 60 * 1000;

      if (!isExpired && account.access_token) {
        const decrypted = decryptToken(account.access_token);
        if (decrypted) {
          tokenCache.set(account.id, decrypted);
          return decrypted;
        }
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

          tokenCache.set(account.id, refreshed.access_token);
          return refreshed.access_token;
        }
      }
    } catch (err) {
      console.warn(`[queue/drain] Token refresh error for account ${account.id}:`, err);
    }

    // Fallback: try decrypting existing access token
    if (account.access_token) {
      try {
        const decrypted = decryptToken(account.access_token);
        if (decrypted) {
          tokenCache.set(account.id, decrypted);
          return decrypted;
        }
      } catch {}
    }

    return null;
  }

  let processedCount = 0;

  // Helper to process a single queue item
  async function processRow(row: QueueRow): Promise<void> {
    const rawAccount = row.gmail_accounts;
    const account = (Array.isArray(rawAccount) ? rawAccount[0] : rawAccount) as AccountRecord | null;

    if (!account) {
      console.warn(`[queue/drain] gmail_account not found for queue item ${row.id}`);
      await db
        .from("pending_queue")
        .update({
          status: "failed",
          error_message: "gmail_account_not_found",
          processed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return;
    }

    const accessToken = await getAccessToken(account);
    if (!accessToken) {
      console.warn(`[queue/drain] could not obtain valid access token for account ${account.id}`);
      await db
        .from("pending_queue")
        .update({
          status: "failed",
          error_message: "token_unavailable",
          processed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      return;
    }

    // Resolve message ID(s): can be a numeric historyId or direct messageId
    const rawId = ((row.message_id || row.history_id) as string || "").trim();
    const isNumericHistoryId = /^\d+$/.test(rawId);
    let messageIds: string[] = [];

    if (isNumericHistoryId) {
      try {
        const historyResult = await getHistory(accessToken, rawId);
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

    // If no new messages associated with this history event, mark completed
    if (messageIds.length === 0) {
      await db
        .from("pending_queue")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", row.id);
      processedCount++;
      return;
    }

    // Process each resolved message
    let atLeastOneSuccess = false;
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
        console.error(`[queue/drain] Error classifying message ${msgId}:`, err);
      }
    }

    // Mark pending_queue row completed
    await db
      .from("pending_queue")
      .update({
        status: atLeastOneSuccess || messageIds.length === 0 ? "completed" : "failed",
        processed_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    processedCount++;
  }

  // Process rows in small concurrent batches of 4 to maximize throughput safely
  const CONCURRENCY = 4;
  for (let i = 0; i < rows.length; i += CONCURRENCY) {
    const chunk = rows.slice(i, i + CONCURRENCY);
    await Promise.allSettled(chunk.map((row) => processRow(row)));
  }

  // 4. Query remaining pending items count
  const { count: remainingCount } = await db
    .from("pending_queue")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return NextResponse.json({
    processed: processedCount,
    remaining: remainingCount ?? 0,
  });
}
