import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

interface PubSubMessage {
  data: string;
  messageId: string;
  publishTime: string;
}

interface PubSubBody {
  message: PubSubMessage;
  subscription: string;
}

interface GmailPushPayload {
  emailAddress: string;
  historyId: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: PubSubBody;
  try {
    body = (await request.json()) as PubSubBody;
  } catch {
    // Must always return 200 to Google or it will retry
    return NextResponse.json({ ok: true });
  }

  if (!body.message?.data) {
    return NextResponse.json({ ok: true });
  }

  let payload: GmailPushPayload;
  try {
    payload = JSON.parse(
      Buffer.from(body.message.data, "base64").toString("utf-8")
    ) as GmailPushPayload;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const { emailAddress, historyId } = payload;

  if (!emailAddress || !historyId) {
    return NextResponse.json({ ok: true });
  }

  const db = createServerClient();

  const { data: account } = await db
    .from("gmail_accounts")
    .select("id, tenant_id")
    .eq("email", emailAddress)
    .eq("sync_enabled", true)
    .single();

  if (!account) {
    // Unknown or deactivated account — still return 200
    return NextResponse.json({ ok: true });
  }

  await db.from("pending_queue").upsert(
    {
      gmail_account_id: account.id,
      tenant_id: account.tenant_id,
      message_id: historyId,
      status: "pending",
      arrived_at: new Date().toISOString(),
    },
    {
      onConflict: "gmail_account_id,message_id",
      ignoreDuplicates: true,
    }
  );

  return NextResponse.json({ ok: true });
}
