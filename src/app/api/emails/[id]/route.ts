import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { getEmailDetail } from "@/lib/gmail/fetch";
import { decryptToken, refreshAccessToken } from "@/lib/gmail/tokens";

export const dynamic = "force-dynamic";

async function getFreshAccessToken(
  db: ReturnType<typeof createServerClient>,
  accountId: string
): Promise<string | null> {
  const { data: account, error } = await db
    .from("gmail_accounts")
    .select("id, access_token, refresh_token, token_expiry")
    .eq("id", accountId)
    .single();

  if (error || !account) {
    return null;
  }

  try {
    const expiry = account.token_expiry ? new Date(account.token_expiry) : null;
    const isExpired = !expiry || expiry.getTime() <= Date.now() + 2 * 60 * 1000;

    if (!isExpired && account.access_token) {
      const decrypted = decryptToken(account.access_token);
      if (decrypted) return decrypted;
    }

    if (account.refresh_token) {
      const refreshed = await refreshAccessToken(account.refresh_token);
      if (refreshed?.access_token) {
        await db
          .from("gmail_accounts")
          .update({
            access_token: refreshed.encrypted_access_token,
            token_expiry: refreshed.expiry.toISOString(),
          })
          .eq("id", account.id);

        return refreshed.access_token;
      }
    }
  } catch (err) {
    console.warn(`[emails/[id]] Token refresh error for account ${accountId}:`, err);
  }

  if (account.access_token) {
    try {
      const decrypted = decryptToken(account.access_token);
      if (decrypted) return decrypted;
    } catch {}
  }

  return null;
}

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

  // If body_html is NULL/missing in DB, fetch fresh HTML on-the-fly from Gmail API without persisting to DB
  if (!email.body_html && email.gmail_account_id && email.message_id) {
    try {
      const accessToken = await getFreshAccessToken(db, email.gmail_account_id);
      if (accessToken) {
        const detail = await getEmailDetail(accessToken, email.message_id);
        if (detail.bodyHtml) {
          email.body_html = detail.bodyHtml;
        }
        if (!email.body_text && detail.bodyText) {
          email.body_text = detail.bodyText;
        }
      }
    } catch (fetchErr) {
      console.warn(
        `[emails/[id]] Live Gmail fetch fallback failed for message ${email.message_id}:`,
        fetchErr
      );
    }
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
