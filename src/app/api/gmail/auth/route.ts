import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.redirect(
      new URL("/sign-in", process.env.NEXT_PUBLIC_APP_URL!)
    );
  }

  const db = createServerClient();

  const { data: appUser, error } = await db
    .from("app_users")
    .select("id, tenant_id")
    .eq("clerk_user_id", userId)
    .single();

  if (error || !appUser) {
    return NextResponse.redirect(
      new URL(
        "/settings?error=user_not_found",
        process.env.NEXT_PUBLIC_APP_URL!
      )
    );
  }

  const statePayload = JSON.stringify({
    userId: appUser.id,
    tenantId: appUser.tenant_id,
  });
  const state = Buffer.from(statePayload).toString("base64url");

  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: process.env.NEXT_PUBLIC_APP_URL! + "/api/gmail/callback",
    response_type: "code",
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.labels",
      "email",
      "profile",
      "openid",
    ].join(" "),
    access_type: "offline",
    prompt: "consent",
    state,
  });

  const googleAuthUrl =
    "https://accounts.google.com/o/oauth2/v2/auth?" + params.toString();

  return NextResponse.redirect(googleAuthUrl);
}
