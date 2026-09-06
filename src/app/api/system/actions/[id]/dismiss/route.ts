import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PATCH /api/system/actions/[id]/dismiss — mark action item as completed
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const db = createServerClient();

  const { data: appUser } = await db
    .from("app_users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { data: updated, error } = await db
    .from("action_items")
    .update({ is_completed: true })
    .eq("id", id)
    .eq("user_id", appUser.id)
    .select()
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: "not_found_or_update_failed" }, { status: 404 });
  }

  return NextResponse.json({ success: true, action: updated });
}
