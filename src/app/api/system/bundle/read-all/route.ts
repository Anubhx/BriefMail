import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// POST /api/system/bundle/read-all — mark all bundled system notifications as read
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
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
    .update({ is_read: true, updated_at: new Date().toISOString() })
    .eq("user_id", appUser.id)
    .in("subcategory", [
      "workspace_notification",
      "platform_digest",
      "system_alert",
      "newsletter",
      "ci_cd_alert",
    ])
    .eq("is_read", false);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
