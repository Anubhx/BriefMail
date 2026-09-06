import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const actionCompleteSchema = z.object({
  email_id: z.string().uuid(),
  action: z.enum(["archive", "mark_read", "label", "snooze"]),
  success: z.boolean(),
  label_id: z.string().optional(),
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

  const parsed = actionCompleteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email_id, action, success, label_id } = parsed.data;
  if (!success) {
    return NextResponse.json({ email_id, action, updated: false, reason: "action_failed_flagged" });
  }

  const db = createServerClient();

  const { data: email, error: fetchErr } = await db
    .from("emails")
    .select("id, labels")
    .eq("id", email_id)
    .single();

  if (fetchErr || !email) {
    return NextResponse.json({ error: "email_not_found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (action === "archive") {
    updates.is_archived = true;
  } else if (action === "mark_read") {
    updates.is_read = true;
  } else if (action === "snooze") {
    updates.is_snoozed = true;
  } else if (action === "label" && label_id) {
    const existingLabels = Array.isArray(email.labels) ? (email.labels as string[]) : [];
    if (!existingLabels.includes(label_id)) {
      updates.labels = [...existingLabels, label_id];
    }
  }

  const { error: updateErr } = await db
    .from("emails")
    .update(updates)
    .eq("id", email_id);

  if (updateErr) {
    return NextResponse.json(
      { error: "failed_to_update_email", details: updateErr.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    email_id,
    action,
    updated: true,
  });
}
