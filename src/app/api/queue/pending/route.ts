import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function validateN8nSecret(request: NextRequest): boolean {
  return request.headers.get("x-n8n-secret") === process.env.N8N_WEBHOOK_SECRET;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!validateN8nSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServerClient();

  const { data: items, error } = await db
    .from("pending_queue")
    .select("*")
    .eq("status", "pending")
    .order("arrived_at", { ascending: true })
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "db_query_failed", details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    count: items?.length ?? 0,
    items: items ?? [],
  });
}
