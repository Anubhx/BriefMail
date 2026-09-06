import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/emails — fetch paginated emails with filtering & search
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const categoryParam = searchParams.get("category")?.toLowerCase();
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));
  const search = searchParams.get("search")?.trim();
  const isReadParam = searchParams.get("is_read");
  const isArchivedParam = searchParams.get("is_archived");

  const db = createServerClient();

  // Find user by clerk_user_id
  const { data: appUser, error: userErr } = await db
    .from("app_users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (userErr || !appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // Base query for emails list
  let query = db
    .from("emails")
    .select(
      `
      id,
      gmail_account_id,
      message_id,
      thread_id,
      subject,
      from_email,
      from_name,
      snippet,
      received_at,
      category,
      subcategory,
      classification_tier,
      confidence_score,
      ai_summary,
      has_action_item,
      is_read,
      is_starred,
      is_archived,
      is_snoozed,
      snoozed_until,
      labels,
      attachments
    `,
      { count: "exact" }
    )
    .eq("user_id", appUser.id);

  // Archive filter: default to non-archived unless specifically requested
  if (isArchivedParam === "true") {
    query = query.eq("is_archived", true);
  } else if (isArchivedParam === "false" || !isArchivedParam) {
    query = query.eq("is_archived", false);
  }

  // Category filter
  if (categoryParam && categoryParam !== "all") {
    if (categoryParam === "career" || categoryParam === "jobs") {
      query = query.in("category", ["career", "jobs"]);
    } else if (categoryParam === "system") {
      query = query.or("category.eq.system,subcategory.in.(workspace_notification,platform_digest,system_alert,newsletter)");
    } else {
      query = query.eq("category", categoryParam);
    }
  }

  // Read / Unread filter
  if (isReadParam !== null && isReadParam !== undefined) {
    query = query.eq("is_read", isReadParam === "true");
  }

  // Search filter
  if (search) {
    query = query.or(`subject.ilike.%${search}%,from_email.ilike.%${search}%,from_name.ilike.%${search}%`);
  }

  // Sorting and Pagination
  const fromIndex = (page - 1) * limit;
  const toIndex = fromIndex + limit - 1;

  query = query.order("received_at", { ascending: false }).range(fromIndex, toIndex);

  const { data: emails, count, error } = await query;

  if (error) {
    console.error("Error fetching emails:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Compute category counts for badge counters
  const { data: categoryStats } = await db
    .from("emails")
    .select("category, subcategory")
    .eq("user_id", appUser.id)
    .eq("is_archived", false);

  const categoryCounts: Record<string, number> = {
    all: categoryStats?.length || 0,
    finance: 0,
    jobs: 0,
    career: 0,
    investments: 0,
    meetings: 0,
    system: 0,
  };

  if (categoryStats) {
    for (const item of categoryStats) {
      const cat = (item.category || "").toLowerCase();
      const sub = (item.subcategory || "").toLowerCase();

      if (cat === "finance") categoryCounts.finance++;
      if (cat === "investments") categoryCounts.investments++;
      if (cat === "meetings") categoryCounts.meetings++;
      if (cat === "career") categoryCounts.career++;
      if (cat === "jobs") categoryCounts.jobs++;
      if (
        cat === "system" ||
        ["workspace_notification", "platform_digest", "system_alert", "newsletter"].includes(sub)
      ) {
        categoryCounts.system++;
      }
    }
    // Aggregate jobs & career count if displayed together
    categoryCounts.career = categoryCounts.career + categoryCounts.jobs;
  }

  const total = count || 0;
  const hasMore = toIndex + 1 < total;

  return NextResponse.json({
    emails: emails || [],
    total,
    page,
    limit,
    hasMore,
    category_counts: categoryCounts,
  });
}
