import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

// GET /api/emails/[id] — fetch full email details and mark as read
export async function GET(
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

  // Fetch complete email details
  const { data: email, error } = await db
    .from("emails")
    .select(`
      id,
      gmail_account_id,
      user_id,
      tenant_id,
      message_id,
      thread_id,
      subject,
      from_email,
      from_name,
      to_email,
      cc_email,
      received_at,
      snippet,
      body_text,
      body_html,
      labels,
      category,
      subcategory,
      classification_tier,
      confidence_score,
      ai_summary,
      extracted_data,
      has_action_item,
      action_items,
      is_read,
      is_starred,
      is_archived,
      is_snoozed,
      snoozed_until,
      attachments,
      raw_headers
    `)
    .eq("id", id)
    .eq("user_id", appUser.id)
    .single();

  if (error || !email) {
    return NextResponse.json({ error: "email_not_found" }, { status: 404 });
  }

  // Mark as read automatically when opened
  if (!email.is_read) {
    await db
      .from("emails")
      .update({ is_read: true, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", appUser.id);

    email.is_read = true;
  }

  return NextResponse.json({ email });
}
