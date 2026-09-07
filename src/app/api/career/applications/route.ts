import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";

const createApplicationSchema = z.object({
  company: z.string().min(1, "Company name is required"),
  role: z.string().min(1, "Role title is required"),
  stage: z.enum(["applied", "shortlisted", "interviewing", "offered", "rejected", "withdrawn"]).default("applied"),
  applied_date: z.string().optional(),
  job_url: z.string().url().optional().or(z.literal("")),
  job_board: z.string().optional(),
  notes: z.string().optional(),
  salary_offered: z.number().optional(),
});

// GET /api/career/applications - fetch all applications for current user
export async function GET(): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

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

  // Fetch applications with joined offer_letters and linked emails
  const { data: applications, error: appErr } = await db
    .from("job_applications")
    .select(`
      *,
      emails (
        id,
        category,
        subcategory,
        subject,
        from_email
      ),
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
    .eq("user_id", appUser.id)
    .order("updated_at", { ascending: false });

  if (appErr) {
    console.error("Error fetching job applications:", appErr);
    return NextResponse.json(
      { error: "failed_to_fetch_applications", details: appErr.message },
      { status: 500 }
    );
  }

  // TASK 1 & TASK 3:
  // WHERE subcategory IN ('application_confirmed', 'interview_invite', 'offer_received', 'application_status')
  // OR subject contains application confirmation signals.
  // Do NOT show job_alert_digest.
  // For role listings: exclude if job board alert, otherwise include.
  const validSubcategories = new Set([
    "application_confirmed",
    "interview_invite",
    "offer_received",
    "application_status",
    "job_application",
    "offer_letter",
  ]);

  const confirmationSignals = [
    "application submitted",
    "you applied",
    "application received",
    "thank you for applying",
    "we received your application",
    "applied for",
    "application for",
  ];

  const roleSubcategories = new Set([
    "uiux_role",
    "design_role",
    "product_role",
    "engineering_role",
  ]);

  const jobBoardDomains = [
    "indeed.com",
    "linkedin.com",
    "naukri.com",
    "internshala.com",
  ];

  const alertKeywords = ["alert", "new", "vacancy", "opening", "hiring"];

  const filteredApplications = (applications || []).filter((app: any) => {
    // Retain manually added applications that have no linked email_id
    if (!app.email_id) return true;

    const email = app.emails;
    if (!email) return false;

    const subcat = (email.subcategory || "").toLowerCase();
    const subject = (email.subject || "").toLowerCase();
    const fromEmail = (email.from_email || "").toLowerCase();
    const compName = (app.company_name || "").toLowerCase();
    const roleTitle = (app.role_title || "").toLowerCase();

    // 0. Course meetings (Futurense, IIT Madras Pravartak, UI UX Manager Cohort) are course sessions, NOT job applications!
    if (
      fromEmail.includes("futurense.com") ||
      compName.includes("futurense") ||
      compName.includes("ui ux manager cohort") ||
      compName.includes("iit madras pravartak") ||
      roleTitle.includes("cohort") ||
      subject.includes("ui ux manager cohort") ||
      subject.includes("iit madras pravartak")
    ) {
      return false;
    }

    // 1. Do NOT show job_alert_digest or job_alert in career kanban
    if (subcat === "job_alert_digest" || subcat === "job_alert") {
      return false;
    }

    // 2. WHERE subcategory IN ('application_confirmed', 'interview_invite', 'offer_received', 'application_status', ...)
    if (validSubcategories.has(subcat)) {
      return true;
    }

    // 3. Subject contains application confirmation signals
    if (confirmationSignals.some((sig) => subject.includes(sig))) {
      return true;
    }

    // 4. For uiux_role, design_role, product_role, engineering_role:
    // Check if from_email contains job board domains AND subject contains alert keywords -> exclude.
    // Otherwise include (might be direct company email).
    if (roleSubcategories.has(subcat)) {
      const isJobBoard = jobBoardDomains.some((domain) => fromEmail.includes(domain));
      const hasAlertWord = alertKeywords.some((word) => subject.includes(word));
      if (isJobBoard && hasAlertWord) {
        return false;
      }
      return true;
    }

    return false;
  });

  return NextResponse.json({ applications: filteredApplications });
}

// POST /api/career/applications - create new application
export async function POST(request: NextRequest): Promise<NextResponse> {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = createApplicationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const {
    company,
    role,
    stage,
    applied_date,
    job_url,
    job_board,
    notes,
    salary_offered,
  } = parsed.data;

  const db = createServerClient();

  // Find user
  const { data: appUser, error: userErr } = await db
    .from("app_users")
    .select("id, tenant_id")
    .eq("clerk_user_id", userId)
    .single();

  if (userErr || !appUser) {
    return NextResponse.json({ error: "user_not_found" }, { status: 404 });
  }

  const appliedDate = applied_date || new Date().toISOString().split("T")[0];
  const portfolioLinks = job_url ? [job_url] : [];

  const { data: newApplication, error: insertErr } = await db
    .from("job_applications")
    .insert({
      tenant_id: appUser.tenant_id,
      user_id: appUser.id,
      company_name: company,
      role_title: role,
      current_stage: stage,
      applied_date: appliedDate,
      job_board: job_board || (job_url ? "direct" : "manual"),
      notes: notes || null,
      salary_offered: salary_offered || null,
      portfolio_links: portfolioLinks,
      last_activity: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (insertErr || !newApplication) {
    console.error("Error creating job application:", insertErr);
    return NextResponse.json(
      { error: "failed_to_create_application", details: insertErr?.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ application: newApplication }, { status: 201 });
}
