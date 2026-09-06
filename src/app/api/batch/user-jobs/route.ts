import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServerClient();

  const { data: appUser, error: userErr } = await db
    .from("app_users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (userErr || !appUser) {
    return NextResponse.json([]);
  }

  const { data: jobs, error: jobsErr } = await db
    .from("batch_jobs")
    .select(
      "id, gmail_account_id, status, total_emails, processed_count, failed_count, date_from, date_to, started_at, completed_at, created_at"
    )
    .eq("user_id", appUser.id)
    .order("created_at", { ascending: false });

  if (jobsErr) {
    return NextResponse.json({ error: "database_error", details: jobsErr.message }, { status: 500 });
  }

  const enhancedJobs = (jobs || []).map((job) => {
    const totalEmails = job.total_emails ?? 0;
    const processedCount = job.processed_count ?? 0;
    let percent = 0;
    if (job.status === "completed") {
      percent = 100;
    } else if (totalEmails > 0) {
      percent = Math.min(100, Math.round((processedCount / totalEmails) * 100));
    }

    return {
      ...job,
      job_id: job.id,
      percent,
      progress_pct: percent,
    };
  });

  return NextResponse.json(enhancedJobs);
}
