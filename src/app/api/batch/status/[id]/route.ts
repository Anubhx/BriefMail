import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: jobId } = await params;
  if (!jobId) {
    return NextResponse.json({ error: "missing_job_id" }, { status: 400 });
  }

  const db = createServerClient();

  // Get app_user record
  const { data: appUser, error: userErr } = await db
    .from("app_users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (userErr || !appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // Fetch job ensuring user ownership (prevent IDOR)
  const { data: job, error: jobErr } = await db
    .from("batch_jobs")
    .select(
      "id, gmail_account_id, status, total_emails, processed_count, failed_count, started_at, completed_at"
    )
    .eq("id", jobId)
    .eq("user_id", appUser.id)
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: "batch_job_not_found" }, { status: 404 });
  }

  // Fetch account email
  let gmailAccountEmail = "";
  if (job.gmail_account_id) {
    const { data: acc } = await db
      .from("gmail_accounts")
      .select("email")
      .eq("id", job.gmail_account_id)
      .single();
    if (acc) {
      gmailAccountEmail = acc.email;
    }
  }

  const totalEmails = job.total_emails ?? 0;
  const processedCount = job.processed_count ?? 0;
  const failedCount = job.failed_count ?? 0;
  const emailsRemaining = Math.max(0, totalEmails - processedCount);
  const pace = 20; // 20 emails per minute (conservative estimate)
  const etaMinutes = Math.ceil(emailsRemaining / pace);
  const progressPct = totalEmails > 0 ? Math.min(100, Math.round((processedCount / totalEmails) * 100)) : 0;

  return NextResponse.json({
    job_id: job.id,
    status: job.status,
    total_emails: totalEmails,
    processed_count: processedCount,
    failed_count: failedCount,
    progress_pct: progressPct,
    eta_minutes: etaMinutes,
    started_at: job.started_at,
    completed_at: job.completed_at,
    gmail_account_email: gmailAccountEmail,
  });
}
