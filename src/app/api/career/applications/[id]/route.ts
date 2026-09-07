import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const updateAppSchema = z.object({
  company: z.string().optional(),
  role: z.string().optional(),
  stage: z.enum(["applied", "shortlisted", "interviewing", "offered", "rejected", "withdrawn"]).optional(),
  applied_date: z.string().optional(),
  notes: z.string().nullable().optional(),
  job_board: z.string().nullable().optional(),
  salary_offered: z.number().nullable().optional(),
});

// GET /api/career/applications/[id]
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

  const { data: application, error } = await db
    .from("job_applications")
    .select(`
      *,
      offer_letters (*)
    `)
    .eq("id", id)
    .eq("user_id", appUser.id)
    .single();

  if (error || !application) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  return NextResponse.json({ application });
}

// PATCH /api/career/applications/[id]
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

  const parsed = updateAppSchema.safeParse(body);
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

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    last_activity: new Date().toISOString(),
  };

  if (parsed.data.company !== undefined) updates.company_name = parsed.data.company;
  if (parsed.data.role !== undefined) updates.role_title = parsed.data.role;
  if (parsed.data.stage !== undefined) updates.current_stage = parsed.data.stage;
  if (parsed.data.applied_date !== undefined) updates.applied_date = parsed.data.applied_date;
  if (parsed.data.notes !== undefined) updates.notes = parsed.data.notes;
  if (parsed.data.job_board !== undefined) updates.job_board = parsed.data.job_board;
  if (parsed.data.salary_offered !== undefined) updates.salary_offered = parsed.data.salary_offered;

  const { data: updated, error } = await db
    .from("job_applications")
    .update(updates)
    .eq("id", id)
    .eq("user_id", appUser.id)
    .select(`
      *,
      offer_letters (*)
    `)
    .single();

  if (error || !updated) {
    return NextResponse.json({ error: error?.message || "not_found" }, { status: 404 });
  }

  return NextResponse.json({ application: updated });
}

// DELETE /api/career/applications/[id]
export async function DELETE(
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

  const userIds = [appUser.id, userId].filter(Boolean);

  // Delete related offer_letters first in case of foreign key constraints
  await db
    .from("offer_letters")
    .delete()
    .eq("job_app_id", id);

  const { error } = await db
    .from("job_applications")
    .delete()
    .eq("id", id)
    .in("user_id", userIds);

  if (error) {
    console.error("Error deleting job application:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ deleted: true, success: true });
}
