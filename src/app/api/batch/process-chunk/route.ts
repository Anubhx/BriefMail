import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getEmailList } from "@/lib/gmail/fetch";
import { decryptToken, refreshAccessToken } from "@/lib/gmail/tokens";

const processChunkSchema = z.object({
  job_id: z.string().uuid(),
  chunk_size: z.number().min(1).max(500).default(400),
});

function validateN8nSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-n8n-secret");
  return secret === process.env.N8N_WEBHOOK_SECRET;
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

  const parsed = processChunkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { job_id, chunk_size } = parsed.data;
  const db = createServerClient();

  // 1. Fetch batch job
  const { data: job, error: jobErr } = await db
    .from("batch_jobs")
    .select(
      "id, user_id, tenant_id, gmail_account_id, status, total_emails, processed_count, current_page_token, date_from, date_to, started_at"
    )
    .eq("id", job_id)
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: "batch_job_not_found" }, { status: 404 });
  }

  const isFirstChunk = !job.current_page_token;

  // 2. Mark job as processing & set started_at if first chunk
  const jobUpdates: Record<string, unknown> = { status: "processing" };
  if (!job.started_at) {
    jobUpdates.started_at = new Date().toISOString();
  }
  await db.from("batch_jobs").update(jobUpdates).eq("id", job_id);

  // 3. Fetch gmail account details and decrypt access token
  const { data: account, error: accErr } = await db
    .from("gmail_accounts")
    .select("id, access_token, refresh_token, token_expiry")
    .eq("id", job.gmail_account_id)
    .single();

  if (accErr || !account) {
    await db.from("batch_jobs").update({ status: "failed" }).eq("id", job_id);
    return NextResponse.json({ error: "gmail_account_not_found" }, { status: 404 });
  }

  let accessToken: string;
  try {
    const expiry = new Date(account.token_expiry as string);
    if (expiry <= new Date(Date.now() + 5 * 60 * 1000)) {
      const refreshed = await refreshAccessToken(account.refresh_token as string);
      accessToken = refreshed.access_token;
      await db
        .from("gmail_accounts")
        .update({
          access_token: refreshed.encrypted_access_token,
          token_expiry: refreshed.expiry.toISOString(),
        })
        .eq("id", job.gmail_account_id);
    } else {
      accessToken = decryptToken(account.access_token as string);
    }
  } catch {
    accessToken = decryptToken(account.access_token as string);
  }

  // 4. Call Gmail API: GET /gmail/v1/users/me/messages with date query and pageToken
  let queryStr = `after:${job.date_from}`;
  if (job.date_to) {
    queryStr += ` before:${job.date_to}`;
  }

  let listRes;
  try {
    listRes = await getEmailList(accessToken, {
      query: queryStr,
      maxResults: chunk_size,
      pageToken: job.current_page_token || undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "gmail_fetch_failed";
    return NextResponse.json({ error: "gmail_fetch_failed", details: msg }, { status: 500 });
  }

  const messages = listRes.messages || [];
  const nextPageToken = listRes.nextPageToken || null;
  const isComplete = !nextPageToken || messages.length === 0;

  // 5. Insert each message into pending_queue (skipping duplicates)
  if (messages.length > 0) {
    const queueRows = messages.map((m) => ({
      gmail_account_id: job.gmail_account_id,
      tenant_id: job.tenant_id,
      message_id: m.id,
      status: "pending",
    }));

    const { error: queueErr } = await db
      .from("pending_queue")
      .upsert(queueRows, {
        onConflict: "gmail_account_id,message_id",
        ignoreDuplicates: true,
      });

    if (queueErr) {
      console.error("Failed to insert messages into pending_queue:", queueErr);
    }
  }

  // 6. Update batch_jobs record (update total_emails on first chunk using actual resultSizeEstimate)
  const updatedProcessedCount = (job.processed_count || 0) + messages.length;
  const newStatus = isComplete ? "completed" : "processing";
  const completedAt = isComplete ? new Date().toISOString() : null;

  const batchUpdates: Record<string, unknown> = {
    processed_count: updatedProcessedCount,
    current_page_token: nextPageToken,
    status: newStatus,
    completed_at: completedAt,
  };

  // Update total_emails with actual resultSizeEstimate on first chunk
  if (
    isFirstChunk &&
    typeof listRes.resultSizeEstimate === "number" &&
    listRes.resultSizeEstimate > 0
  ) {
    batchUpdates.total_emails = listRes.resultSizeEstimate;
  }

  await db
    .from("batch_jobs")
    .update(batchUpdates)
    .eq("id", job_id);

  return NextResponse.json({
    job_id,
    processed_this_chunk: messages.length,
    next_page_token: nextPageToken,
    is_complete: isComplete,
    total_processed: updatedProcessedCount,
    total_emails:
      isFirstChunk && listRes.resultSizeEstimate
        ? listRes.resultSizeEstimate
        : job.total_emails,
    result_size_estimate: listRes.resultSizeEstimate,
  });
}

