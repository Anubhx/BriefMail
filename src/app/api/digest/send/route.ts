import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const sendDigestSchema = z.object({
  user_id: z.string().uuid(),
  stats: z.object({
    unread_count: z.number(),
    by_category: z.record(z.string(), z.number()),
  }),
  action_items: z.array(z.any()),
  upcoming_meetings: z.array(z.any()),
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

  const parsed = sendDigestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { user_id, stats, action_items, upcoming_meetings } = parsed.data;

  // Log digest payload
  console.log(`[Digest Send] Queueing digest email for user ${user_id}:`, {
    unread_count: stats.unread_count,
    categories: Object.keys(stats.by_category).length,
    action_items_count: action_items.length,
    meetings_count: upcoming_meetings.length,
  });

  // TODO: Phase 12 - integrate Resend/Nodemailer for actual email sending
  return NextResponse.json({
    sent: false,
    reason: "email_provider_not_configured",
    message: "Digest logged successfully. Email provider sending will be enabled in Phase 12.",
  });
}
