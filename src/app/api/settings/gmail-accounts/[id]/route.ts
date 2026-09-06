import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function DELETE(
  _request: NextRequest,
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

  // 2. Delete the account ensuring user ownership
  const { error: deleteErr } = await db
    .from("gmail_accounts")
    .delete()
    .eq("id", accountId)
    .eq("user_id", appUser.id);

  if (deleteErr) {
    return NextResponse.json(
      { error: "delete_failed", details: deleteErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, id: accountId });
}
