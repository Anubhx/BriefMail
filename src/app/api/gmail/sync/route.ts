import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getHistory } from "@/lib/gmail/fetch";

const bodySchema = z.object({
  account_id: z.string().uuid(),
  access_token: z.string().min(1),
  history_id: z.string().min(1),
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

  const { account_id, access_token, history_id } = parsed.data;
  const db = createServerClient();

  let historyResult: Awaited<ReturnType<typeof getHistory>>;
  try {
    historyResult = await getHistory(access_token, history_id, {
      historyTypes: ["messageAdded"],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown_error";
    if (message === "gmail_auth_expired") {
      return NextResponse.json(
        { error: "token_expired", account_id },
        { status: 401 }
      );
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }

  // Extract all message IDs from messagesAdded
  const rawMessageIds = new Set<string>();
  for (const histEntry of historyResult.history) {
    if (histEntry.messagesAdded) {
      for (const added of histEntry.messagesAdded) {
        rawMessageIds.add(added.message.id);
      }
    }
  }

  const allMessageIds = Array.from(rawMessageIds);

  // Exclude already-processed message IDs
  let newMessageIds: string[] = [];
  if (allMessageIds.length > 0) {
    const { data: existing } = await db
      .from("emails")
      .select("message_id")
      .in("message_id", allMessageIds);

    const existingSet = new Set((existing ?? []).map((e: { message_id: string }) => e.message_id));
    newMessageIds = allMessageIds.filter((id) => !existingSet.has(id));
  }

  // Update history_id to the latest one returned
  await db
    .from("gmail_accounts")
    .update({ history_id: historyResult.historyId })
    .eq("id", account_id);

  return NextResponse.json({
    new_messages_count: newMessageIds.length,
    message_ids: newMessageIds,
    account_id,
  });
}
