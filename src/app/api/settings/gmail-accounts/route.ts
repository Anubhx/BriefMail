import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServerClient();

  // 1. Resolve internal app_users.id using clerk_user_id
  const { data: appUser, error: userErr } = await db
    .from("app_users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (userErr || !appUser) {
    // User does not exist in app_users yet -> return empty array
    return NextResponse.json([]);
  }

  // 2. Fetch connected accounts (never select or return tokens)
  const { data: accounts, error: accErr } = await db
    .from("gmail_accounts")
    .select("id, email, display_name, last_synced_at, sync_enabled, watch_expiry")
    .eq("user_id", appUser.id)
    .order("created_at", { ascending: true });

  if (accErr) {
    return NextResponse.json(
      { error: "failed_to_fetch_accounts", details: accErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json(accounts ?? []);
}
