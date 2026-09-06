import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id: accountId } = await params;
  if (!accountId) {
    return NextResponse.json({ error: "missing_account_id" }, { status: 400 });
  }

  const db = createServerClient();

  // 1. Resolve internal app_users.id using clerk_user_id
  const { data: appUser, error: userErr } = await db
    .from("app_users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (userErr || !appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // 2. Verify account exists and belongs to current user
  const { data: account, error: accErr } = await db
    .from("gmail_accounts")
    .select("id, sync_enabled")
    .eq("id", accountId)
    .eq("user_id", appUser.id)
    .single();

  if (accErr || !account) {
    return NextResponse.json(
      { error: "gmail_account_not_found" },
      { status: 404 }
    );
  }

  // Determine target sync_enabled state
  let nextSyncEnabled = !account.sync_enabled;
  try {
    const body = await request.json();
    if (typeof body?.sync_enabled === "boolean") {
      nextSyncEnabled = body.sync_enabled;
    }
  } catch {
    // If no body provided, defaults to toggling current state
  }

  // 3. Update sync_enabled
  const { data: updated, error: updateErr } = await db
    .from("gmail_accounts")
    .update({ sync_enabled: nextSyncEnabled })
    .eq("id", accountId)
    .eq("user_id", appUser.id)
    .select("id, sync_enabled")
    .single();

  if (updateErr || !updated) {
    return NextResponse.json(
      { error: "update_failed", details: updateErr?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    id: updated.id,
    sync_enabled: updated.sync_enabled,
  });
}
