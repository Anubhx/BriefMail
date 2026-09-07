import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { decryptToken, refreshAccessToken } from "@/lib/gmail/tokens";

const bodySchema = z.object({
  account_id: z.string().uuid(),
});

function validateN8nSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-n8n-secret");
  return secret === process.env.N8N_WEBHOOK_SECRET;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!validateN8nSecret(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { account_id } = parsed.data;
  const db = createServerClient();

  const { data: account, error } = await db
    .from("gmail_accounts")
    .select("id, email, access_token, refresh_token, token_expiry")
    .eq("id", account_id)
    .single();

  if (error || !account) {
    return NextResponse.json({ error: "account_not_found" }, { status: 404 });
  }

  const now = new Date();
  const expiry = new Date(account.token_expiry as string);
  const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
  const isExpired = expiry <= fiveMinutesFromNow;

  if (!isExpired) {
    const accessToken = decryptToken(account.access_token as string);
    return NextResponse.json({
      access_token: accessToken,
      account_id,
      email: account.email,
    });
  }

  // Token is expired or expiring soon - refresh it
  try {
    const refreshed = await refreshAccessToken(account.refresh_token as string);

    await db
      .from("gmail_accounts")
      .update({
        access_token: refreshed.encrypted_access_token,
        token_expiry: refreshed.expiry.toISOString(),
      })
      .eq("id", account_id);

    return NextResponse.json({
      access_token: refreshed.access_token,
      account_id,
      email: account.email,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "refresh_failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
