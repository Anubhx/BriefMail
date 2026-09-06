import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function validateN8nSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-n8n-secret");
  return secret === process.env.N8N_WEBHOOK_SECRET;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!validateN8nSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServerClient();

  const { data: jobs, error } = await db
    .from("batch_jobs")
    .select("id, user_id, tenant_id, gmail_account_id, status, total_emails, processed_count, current_page_token, date_from, date_to, chunk_size, created_at")
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json(
      { error: "database_error", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    jobs_count: jobs?.length ?? 0,
    jobs: jobs ?? [],
  });
}
