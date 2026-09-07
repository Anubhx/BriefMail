import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/emails - fetch paginated emails with filtering & search
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
  const isStarredParam = searchParams.get("is_starred");
  const isSnoozedParam = searchParams.get("is_snoozed");
  const dateFrom = searchParams.get("date_from")?.trim();
  const dateTo = searchParams.get("date_to")?.trim();
  const sortParam = searchParams.get("sort") || "received_at";
  const orderParam = searchParams.get("order")?.toLowerCase() === "asc" ? "asc" : "desc";
  const gmailAccountId = searchParams.get("gmail_account_id")?.trim();

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

  // Gmail account filter
  if (gmailAccountId && gmailAccountId !== "all") {
    query = query.eq("gmail_account_id", gmailAccountId);
  }

  // Archive filter:
  // "true" -> archived only
  // "false" -> unarchived only
  // "all" -> don't filter on is_archived
  // undefined/null -> default to unarchived (is_archived = false) unless starred or snoozed directly
  if (isArchivedParam === "true") {
    query = query.eq("is_archived", true);
  } else if (isArchivedParam === "false") {
    query = query.eq("is_archived", false);
  } else if (isArchivedParam === "all") {
    // No filter on is_archived - return all
  } else if (!isArchivedParam && isStarredParam !== "true" && isSnoozedParam !== "true") {
    query = query.eq("is_archived", false);
  }

  // Starred filter
  if (isStarredParam === "true") {
    query = query.eq("is_starred", true);
  } else if (isStarredParam === "false") {
    query = query.eq("is_starred", false);
  }

  // Snoozed filter
  if (isSnoozedParam === "true") {
    query = query.eq("is_snoozed", true);
  } else if (isSnoozedParam === "false") {
    query = query.eq("is_snoozed", false);
  }

  // Category filter: supports single category or comma-separated categories (?category=finance,jobs)
  if (categoryParam && categoryParam !== "all") {
    const categories = categoryParam
      .split(",")
      .map((c) => c.trim())
      .map((c) => (c === "finance" ? "finance_transaction" : c))
      .filter(Boolean);

    if (categories.length > 1) {
      query = query.in("category", categories);
    } else if (categories.length === 1) {
      const singleCat = categories[0];
      if (singleCat === "career" || singleCat === "jobs") {
        // Exclude Futurense / IIT Madras Pravartak / UI UX Manager Cohort course meetings from career/jobs
        query = query
          .in("category", ["career", "jobs"])
          .not("from_email", "ilike", "%futurense.com%")
          .not("from_name", "ilike", "%ui ux manager cohort%")
          .not("from_name", "ilike", "%iit madras pravartak%")
          .not("subject", "ilike", "%ui ux manager cohort%")
          .not("subject", "ilike", "%iit madras pravartak%");
      } else if (singleCat === "meetings") {
        query = query.or(
          "category.eq.meetings,subcategory.eq.meeting_invite,from_email.ilike.%futurense.com%,from_name.ilike.%ui ux manager cohort%"
        );
      } else if (singleCat === "system") {
        query = query.or(
          "category.eq.system,subcategory.in.(workspace_notification,platform_digest,system_alert,newsletter)"
        );
      } else if (singleCat === "otp") {
        query = query.or("category.eq.otp,subcategory.eq.otp_verification");
      } else if (singleCat === "finance_transaction" || singleCat === "finance") {
        // Explicitly exclude "HDFC Sky" from finance emails (other HDFC such as HDFC Bank, cards, loans remain)
        query = query
          .or("category.eq.finance_transaction,category.eq.finance")
          .not("from_name", "ilike", "%hdfc sky%")
          .not("from_name", "ilike", "%hdfcsky%")
          .not("from_email", "ilike", "%hdfcsky%")
          .not("subject", "ilike", "%hdfc sky%")
          .not("subject", "ilike", "%hdfcsky%");
      } else {
        query = query.eq("category", singleCat);
      }
    }
  }

  // Read / Unread filter
  if (isReadParam !== null && isReadParam !== undefined && isReadParam !== "all") {
    query = query.eq("is_read", isReadParam === "true");
  }

  // Date range filters (received_at)
  if (dateFrom) {
    const fromDate = new Date(dateFrom);
    if (!isNaN(fromDate.getTime())) {
      query = query.gte("received_at", fromDate.toISOString());
    }
  }

  if (dateTo) {
    const toDate = new Date(dateTo);
    if (!isNaN(toDate.getTime())) {
      if (dateTo.length <= 10) {
        toDate.setHours(23, 59, 59, 999);
      }
      query = query.lte("received_at", toDate.toISOString());
    }
  }

  // Search filter
  if (search) {
    query = query.or(`subject.ilike.%${search}%,from_email.ilike.%${search}%,from_name.ilike.%${search}%`);
  }

  // Sorting & Pagination
  const validSortColumns = ["received_at", "from_name", "subject"];
  const sortColumn = validSortColumns.includes(sortParam) ? sortParam : "received_at";
  const ascending = orderParam === "asc";

  const fromIndex = (page - 1) * limit;
  const toIndex = fromIndex + limit - 1;

  query = query.order(sortColumn, { ascending }).range(fromIndex, toIndex);

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
    finance_transaction: 0,
    jobs: 0,
    career: 0,
    investments: 0,
    meetings: 0,
    system: 0,
    ads: 0,
    social: 0,
    newsletter: 0,
    otp: 0,
  };

  if (categoryStats) {
    for (const item of categoryStats) {
      const cat = (item.category || "").toLowerCase();
      const sub = (item.subcategory || "").toLowerCase();

      if (cat === "finance") categoryCounts.finance++;
      if (cat === "finance_transaction") {
        categoryCounts.finance_transaction++;
        categoryCounts.finance++;
      }
      if (cat === "investments") categoryCounts.investments++;
      if (cat === "meetings") categoryCounts.meetings++;
      if (cat === "career") categoryCounts.career++;
      if (cat === "jobs") categoryCounts.jobs++;
      if (cat === "ads") categoryCounts.ads++;
      if (cat === "social") categoryCounts.social++;
      if (cat === "newsletter") categoryCounts.newsletter++;
      if (cat === "otp" || sub === "otp_verification") categoryCounts.otp++;
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
