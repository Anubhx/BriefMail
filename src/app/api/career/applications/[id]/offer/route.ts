import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const offerSchema = z.object({
  ctc_lpa: z.number().nullable().optional(),
  fixed_lpa: z.number().nullable().optional(),
  variable_lpa: z.number().nullable().optional(),
  joining_date: z.string().nullable().optional(),
  offer_deadline: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  work_mode: z.enum(["remote", "hybrid", "onsite"]).nullable().optional(),
  offer_letter_url: z.string().nullable().optional(),
  raw_text: z.string().nullable().optional(),
  status: z.enum(["pending", "accepted", "declined", "expired"]).default("pending"),
});

// GET /api/career/applications/[id]/offer
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

  const { data: offer, error } = await db
    .from("offer_letters")
    .select("*")
    .eq("job_app_id", id)
    .eq("user_id", appUser.id)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ offer: offer || null });
}

// POST / PATCH /api/career/applications/[id]/offer - save or update offer details
export async function POST(
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

  const parsed = offerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const db = createServerClient();

  const { data: appUser } = await db
    .from("app_users")
    .select("id, tenant_id")
    .eq("clerk_user_id", userId)
    .single();

  if (!appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  // Get application info
  const { data: app, error: appErr } = await db
    .from("job_applications")
    .select("id, company_name, role_title, email_id")
    .eq("id", id)
    .eq("user_id", appUser.id)
    .single();

  if (appErr || !app) {
    return NextResponse.json({ error: "application_not_found" }, { status: 404 });
  }

  const {
    ctc_lpa,
    fixed_lpa,
    variable_lpa,
    joining_date,
    offer_deadline,
    location,
    work_mode,
    offer_letter_url,
    raw_text,
    status,
  } = parsed.data;

  // Check if existing offer record
  const { data: existingOffer } = await db
    .from("offer_letters")
    .select("id")
    .eq("job_app_id", id)
    .eq("user_id", appUser.id)
    .maybeSingle();

  let offerResult;

  if (existingOffer?.id) {
    const { data: updated, error: updateErr } = await db
      .from("offer_letters")
      .update({
        ctc_lpa: ctc_lpa ?? null,
        fixed_lpa: fixed_lpa ?? null,
        variable_lpa: variable_lpa ?? null,
        joining_date: joining_date ? joining_date.split("T")[0] : null,
        offer_deadline: offer_deadline ? offer_deadline.split("T")[0] : null,
        location: location ?? null,
        work_mode: work_mode ?? null,
        raw_text: offer_letter_url ? (raw_text ? `${raw_text}\nURL: ${offer_letter_url}` : `URL: ${offer_letter_url}`) : raw_text ?? null,
        status: status ?? "pending",
      })
      .eq("id", existingOffer.id)
      .select()
      .single();

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }
    offerResult = updated;
  } else {
    const { data: inserted, error: insertErr } = await db
      .from("offer_letters")
      .insert({
        tenant_id: appUser.tenant_id,
        user_id: appUser.id,
        email_id: app.email_id || null,
        job_app_id: app.id,
        company_name: app.company_name,
        role_title: app.role_title,
        ctc_lpa: ctc_lpa ?? null,
        fixed_lpa: fixed_lpa ?? null,
        variable_lpa: variable_lpa ?? null,
        joining_date: joining_date ? joining_date.split("T")[0] : null,
        offer_deadline: offer_deadline ? offer_deadline.split("T")[0] : null,
        location: location ?? null,
        work_mode: work_mode ?? null,
        raw_text: offer_letter_url ? (raw_text ? `${raw_text}\nURL: ${offer_letter_url}` : `URL: ${offer_letter_url}`) : raw_text ?? null,
        status: status ?? "pending",
      })
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }
    offerResult = inserted;
  }

  // Also update offer_details on job_applications
  await db
    .from("job_applications")
    .update({
      offer_details: {
        salary_lpa: ctc_lpa,
        fixed_lpa,
        variable_lpa,
        joining_date,
        location,
      },
      salary_offered: ctc_lpa ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({ offer: offerResult });
}
