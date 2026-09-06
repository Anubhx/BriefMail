import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const timestamp = new Date().toISOString();

  try {
    const supabase = createServerClient();

    // 1. Insert a row into keepalive_pings table using Supabase service role client
    const { error: pingError } = await supabase.from("keepalive_pings").insert({
      pinged_at: timestamp,
      source: "vercel_cron_keepalive",
    });

    if (pingError) {
      console.warn("keepalive_pings insert notice:", pingError.message);
    }

    // 2. Perform a simple SELECT on emails table to ensure DB stays awake
    const { error: emailsError } = await supabase.from("emails").select("id").limit(1);

    if (emailsError) {
      console.warn("emails table query notice:", emailsError.message);
    }

    return NextResponse.json({
      pinged_at: timestamp,
      status: "ok",
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json(
      { status: "error", message: errorMessage },
      { status: 500 }
    );
  }
}
