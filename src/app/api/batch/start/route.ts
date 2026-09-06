import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getEmailList } from "@/lib/gmail/fetch";
import { decryptToken, refreshAccessToken } from "@/lib/gmail/tokens";

const startBatchSchema = z.object({
  gmail_account_id: z.string().uuid(),
  date_from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD"),
  date_to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format, expected YYYY-MM-DD").optional(),
  chunk_size: z.number().min(5).max(500).default(100),
});


export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = startBatchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { gmail_account_id, date_from, date_to, chunk_size } = parsed.data;
  const db = createServerClient();

  // 1. Get user details from app_users
  const { data: appUser, error: userErr } = await db
    .from("app_users")
    .select("id, tenant_id")
    .eq("clerk_user_id", userId)
    .single();

  if (userErr || !appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // 2. Verify gmail account ownership (prevent IDOR)
  const { data: gmailAccount, error: accErr } = await db
    .from("gmail_accounts")
    .select("id, access_token, refresh_token, token_expiry")
    .eq("id", gmail_account_id)
    .eq("user_id", appUser.id)
    .single();

  if (accErr || !gmailAccount) {
    return NextResponse.json(
      { error: "gmail_account_not_found" },
      { status: 404 }
    );
  }

  // 3. Check for existing active batch job for this account
  const { data: existingJobs } = await db
    .from("batch_jobs")
    .select("id, status")
    .eq("gmail_account_id", gmail_account_id)
    .in("status", ["pending", "processing"]);

  if (existingJobs && existingJobs.length > 0) {
    return NextResponse.json(
      {
        error: "active_batch_job_exists",
        job_id: existingJobs[0].id,
        status: existingJobs[0].status,
      },
      { status: 409 }
    );
  }

  // 4. Get active access token to estimate total emails
  let accessToken: string | null = null;
  try {
    const expiry = new Date(gmailAccount.token_expiry as string);
    if (expiry <= new Date(Date.now() + 5 * 60 * 1000)) {
      const refreshed = await refreshAccessToken(gmailAccount.refresh_token as string);
      accessToken = refreshed.access_token;
      await db
        .from("gmail_accounts")
        .update({
          access_token: refreshed.encrypted_access_token,
          token_expiry: refreshed.expiry.toISOString(),
        })
        .eq("id", gmail_account_id);
    } else {
      accessToken = decryptToken(gmailAccount.access_token as string);
    }
  } catch (err) {
    console.warn("Could not decrypt/refresh token for estimation:", err);
  }

  // 5. Estimate total emails using Gmail API query
  let estimate = 0;
  if (accessToken) {
    let queryStr = `after:${date_from}`;
    if (date_to) {
      queryStr += ` before:${date_to}`;
    }

    try {
      const listRes = await getEmailList(accessToken, {
        query: queryStr,
        maxResults: 1,
      });
      estimate = listRes.resultSizeEstimate || 0;
    } catch (err) {
      console.warn("Failed to get Gmail result estimate:", err);
    }
  }

  // 6. Insert into batch_jobs table
  const { data: newJob, error: jobCreateErr } = await db
    .from("batch_jobs")
    .insert({
      user_id: appUser.id,
      tenant_id: appUser.tenant_id,
      gmail_account_id,
      job_type: "historical_ingest",
      status: "pending",
      total_emails: estimate > 0 ? estimate : 0,
      processed_count: 0,
      failed_count: 0,
      date_from,
      date_to: date_to ?? null,
      chunk_size,
      current_page_token: null,
    })
    .select("id, status")
    .single();

  if (jobCreateErr || !newJob) {
    return NextResponse.json(
      { error: "failed_to_create_batch_job", details: jobCreateErr?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    job_id: newJob.id,
    status: "pending",
    estimated_total: estimate,
  });
}
