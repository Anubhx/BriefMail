import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// PATCH /api/emails/[id]/star
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let isStarred = true;
  try {
    const body = await request.json();
    if (typeof body.is_starred === "boolean") {
      isStarred = body.is_starred;
    }
  } catch {
    // Default to true if not provided
  }

  const db = createServerClient();
  const { data: appUser } = await db
    .from("app_users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const { error } = await db
    .from("emails")
    .update({
      is_starred: isStarred,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", appUser.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, is_starred: isStarred });
}
