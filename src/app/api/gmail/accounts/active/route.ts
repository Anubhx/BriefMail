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

  const { data: accounts, error } = await db
    .from("gmail_accounts")
    .select("id, email, display_name, history_id, user_id, tenant_id")
    .eq("sync_enabled", true);

  if (error) {
    return NextResponse.json(
      { error: "db_query_failed", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ accounts: accounts ?? [] });
}
