import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { encryptToken } from "@/lib/gmail/tokens";

const SETTINGS_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "") + "/dashboard/settings";

function redirectError(reason: string): NextResponse {
  return NextResponse.redirect(`${SETTINGS_URL}?error=${reason}`);
}

interface GoogleTokenExchangeResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  error?: string;
}

interface GoogleUserInfo {
  email: string;
  name: string;
}

interface GoogleWatchResponse {
  historyId: string;
  expiration: string;
}

interface OAuthState {
  userId: string;
  tenantId: string;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateParam = searchParams.get("state");

  if (!code || !stateParam) {
    return redirectError("oauth_failed");
  }

  let state: OAuthState;
  try {
    state = JSON.parse(
      Buffer.from(stateParam, "base64url").toString("utf-8")
    ) as OAuthState;
  } catch {
    return redirectError("invalid_state");
  }

  const { userId, tenantId } = state;

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.NEXT_PUBLIC_APP_URL! + "/api/gmail/callback";

  if (!clientId || !clientSecret) {
    return redirectError("server_misconfigured");
  }

  // Step 1: Exchange code for tokens
  let tokenData: GoogleTokenExchangeResponse;
  try {
    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });
    tokenData = (await tokenRes.json()) as GoogleTokenExchangeResponse;
  } catch {
    return redirectError("token_exchange_failed");
  }

  if (tokenData.error || !tokenData.access_token) {
    return redirectError("token_exchange_error");
  }

  if (!tokenData.refresh_token) {
    return redirectError("no_refresh_token");
  }

  // Step 2: Get user info
  let userInfo: GoogleUserInfo;
  try {
    const userRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );
    userInfo = (await userRes.json()) as GoogleUserInfo;
  } catch {
    return redirectError("userinfo_failed");
  }

  if (!userInfo.email) {
    return redirectError("no_email_in_userinfo");
  }

  // Step 3: Encrypt tokens
  const encryptedAccessToken = encryptToken(tokenData.access_token);
  const encryptedRefreshToken = encryptToken(tokenData.refresh_token);
  const tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

  // Step 4: Upsert gmail_accounts
  const db = createServerClient();

  const { data: gmailAccount, error: upsertError } = await db
    .from("gmail_accounts")
    .upsert(
      {
        user_id: userId,
        tenant_id: tenantId,
        email: userInfo.email,
        display_name: userInfo.name,
        access_token: encryptedAccessToken,
        refresh_token: encryptedRefreshToken,
        token_expiry: tokenExpiry.toISOString(),
        sync_enabled: true,
      },
      {
        onConflict: "user_id,email",
      }
    )
    .select("id")
    .single();

  if (upsertError || !gmailAccount) {
    return redirectError("db_upsert_failed");
  }

  // Step 5: Set up Gmail Pub/Sub watch
  const pubSubTopic = process.env.GOOGLE_PUBSUB_TOPIC;
  if (!pubSubTopic) {
    return redirectError("pubsub_topic_missing");
  }

  let watchData: GoogleWatchResponse;
  try {
    const watchRes = await fetch(
      "https://www.googleapis.com/gmail/v1/users/me/watch",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          topicName: pubSubTopic,
          labelIds: ["INBOX"],
        }),
      }
    );
    watchData = (await watchRes.json()) as GoogleWatchResponse;
  } catch {
    return redirectError("watch_setup_failed");
  }

  if (!watchData.historyId) {
    return redirectError("watch_missing_history_id");
  }

  const watchExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db
    .from("gmail_accounts")
    .update({
      history_id: watchData.historyId,
      watch_expiry: watchExpiry.toISOString(),
    })
    .eq("id", gmailAccount.id);

  return NextResponse.redirect(`${SETTINGS_URL}?connected=true`);
}
