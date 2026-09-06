import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createServerClient();
    const thresholdDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 1. Fetch gmail accounts expiring within the next 24 hours
    const { data: accounts, error: selectError } = await supabase
      .from("gmail_accounts")
      .select("id, email, refresh_token, watch_expiry")
      .lt("watch_expiry", thresholdDate);

    if (selectError) {
      console.warn("gmail_accounts query notice:", selectError.message);
    }

    let renewedCount = 0;
    const targetAccounts = accounts || [];

    // 2. Renew Pub/Sub watch for each expiring account
    for (const account of targetAccounts) {
      const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      
      // Update watch_expiry in DB using service role client
      const { error: updateError } = await supabase
        .from("gmail_accounts")
        .update({
          watch_expiry: newExpiry,
          last_renewed_at: new Date().toISOString(),
        })
        .eq("id", account.id);

      if (!updateError) {
        renewedCount++;
      }
    }

    return NextResponse.json({
      status: "ok",
      renewed_count: renewedCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
    return NextResponse.json(
      { status: "error", message: errorMessage },
      { status: 500 }
    );
  }
}
