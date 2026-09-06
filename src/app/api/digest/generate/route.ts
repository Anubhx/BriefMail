import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

function validateN8nSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-n8n-secret");
  return secret === process.env.N8N_WEBHOOK_SECRET;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!validateN8nSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = createServerClient();

  // Fetch all app users
  const { data: users, error: usersErr } = await db
    .from("app_users")
    .select("id, email, preferences");

  if (usersErr || !users) {
    return NextResponse.json(
      { error: "database_error", details: usersErr?.message },
      { status: 500 }
    );
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const twentyFourHoursLater = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const todayStr = now.toISOString().split("T")[0];
  const threeDaysLaterStr = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  const userDigests = [];

  for (const user of users) {
    const prefs = (user.preferences as Record<string, unknown>) || {};
    const digestEnabled = prefs.digest_enabled !== false; // default true if not set

    if (!digestEnabled) continue;

    // 1. Unread email count in last 24h
    const { count: unreadCount } = await db
      .from("emails")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("is_read", false)
      .gte("received_at", twentyFourHoursAgo);

    // 2. Count by category in last 24h
    const { data: catEmails } = await db
      .from("emails")
      .select("category")
      .eq("user_id", user.id)
      .gte("received_at", twentyFourHoursAgo);

    const byCategory: Record<string, number> = {};
    if (catEmails) {
      for (const e of catEmails) {
        const cat = e.category || "misc";
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      }
    }

    // 3. Action items pending created in last 24h
    const { data: actionItems } = await db
      .from("action_items")
      .select("id, type, title, description, due_date")
      .eq("user_id", user.id)
      .eq("is_completed", false)
      .gte("created_at", twentyFourHoursAgo);

    // 4. Upcoming meetings in next 24h
    const { data: upcomingMeetings } = await db
      .from("meetings")
      .select("id, title, start_time, meeting_link, platform")
      .eq("user_id", user.id)
      .gte("start_time", now.toISOString())
      .lte("start_time", twentyFourHoursLater);

    // 5. Finance alerts (EMI due in next 3 days)
    const { data: financeAlerts } = await db
      .from("emi_entries")
      .select("id, lender_name, emi_amount, next_due_date")
      .eq("user_id", user.id)
      .gte("next_due_date", todayStr)
      .lte("next_due_date", threeDaysLaterStr);

    userDigests.push({
      user_id: user.id,
      email: user.email,
      digest_enabled: true,
      stats: {
        unread_count: unreadCount ?? 0,
        by_category: byCategory,
      },
      highlights: [],
      action_items: actionItems ?? [],
      upcoming_meetings: upcomingMeetings ?? [],
      finance_alerts: financeAlerts ?? [],
    });
  }

  return NextResponse.json({ users: userDigests });
}
