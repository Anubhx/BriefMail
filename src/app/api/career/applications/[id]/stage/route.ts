import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const updateStageSchema = z.object({
  stage: z.enum(["applied", "shortlisted", "interviewing", "offered", "rejected", "withdrawn"]),
});

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ error: "missing_id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = updateStageSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { stage } = parsed.data;
  const db = createServerClient();

  // Find user by clerk_user_id
  const { data: appUser, error: userErr } = await db
    .from("app_users")
    .select("id, tenant_id")
    .eq("clerk_user_id", userId)
    .single();

  if (userErr || !appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // Update current_stage with user_id check to prevent IDOR
  const { data: updated, error: updateErr } = await db
    .from("job_applications")
    .update({
      current_stage: stage,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("user_id", appUser.id)
    .select(`
      *,
      offer_letters (
        id,
        ctc_lpa,
        fixed_lpa,
        variable_lpa,
        joining_date,
        offer_deadline,
        location,
        work_mode,
        raw_text,
        status
      )
    `)
    .single();

  if (updateErr || !updated) {
    console.error("Error updating stage:", updateErr);
    return NextResponse.json(
      { error: "application_not_found_or_update_failed", details: updateErr?.message },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, application: updated });
}
