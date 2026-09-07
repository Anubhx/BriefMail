import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/system/bundle - fetch bundled low-priority notifications
export async function GET(request: NextRequest): Promise<NextResponse> {
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

  // Fetch emails with subcategory in workspace_notification, platform_digest, system_alert, etc.
  const { data: emails, error } = await db
    .from("emails")
    .select(`
      id,
      subject,
      snippet,
      from_name,
      from_email,
      received_at,
      is_read,
      category,
      subcategory
    `)
    .eq("user_id", appUser.id)
    .in("subcategory", [
      "workspace_notification",
      "platform_digest",
      "system_alert",
      "newsletter",
      "ci_cd_alert",
    ])
    .eq("is_archived", false)
    .order("received_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("Error fetching system bundle:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list = emails || [];
  const unreadCount = list.filter((e) => !e.is_read).length;

  return NextResponse.json({
    count: list.length,
    unread_count: unreadCount,
    emails: list,
  });
}
