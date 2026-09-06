import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const snoozeSchema = z.object({
  snooze_until: z.string().datetime().nullable().optional(),
  is_snoozed: z.boolean().optional(),
});

// PATCH /api/emails/[id]/snooze
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = snoozeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = createServerClient();
  const { data: appUser } = await db
    .from("app_users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const isSnoozed = parsed.data.is_snoozed !== undefined ? parsed.data.is_snoozed : true;
  const snoozeUntil = isSnoozed ? parsed.data.snooze_until || null : null;

  const { error } = await db
    .from("emails")
    .update({
      is_snoozed: isSnoozed,
      snooze_until: snoozeUntil,
      snoozed_until: snoozeUntil,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", appUser.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
