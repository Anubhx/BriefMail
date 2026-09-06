import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServerClient } from "@/lib/supabase/server";
import { getEmailList, getEmailDetail } from "@/lib/gmail/fetch";
import { decryptToken, refreshAccessToken } from "@/lib/gmail/tokens";
import { classifyEmail, EmailInput } from "@/lib/ai/classify-pipeline";
import { SupabaseClient } from "@supabase/supabase-js";

const processChunkSchema = z.object({
  job_id: z.string().uuid(),
  chunk_size: z.number().default(20),
});

function validateN8nSecret(request: NextRequest): boolean {
  const secret = request.headers.get("x-n8n-secret");
  return secret === process.env.N8N_WEBHOOK_SECRET;
}

// ── Helper 1: Financial Data Insertion ────────────────────────────────────────
async function insertFinancialData(
  emailId: string,
  userId: string,
  tenantId: string,
  subcategory: string,
  extractedData: Record<string, unknown> | undefined,
  supabase: SupabaseClient
) {
  if (!extractedData) return;

  const ext = extractedData;

  if (subcategory === "emi_payment") {
    const lender = (ext.lender as string) || (ext.merchant as string) || "Unknown Lender";
    const emiAmount = (ext.emi_amount as number) || (ext.amount as number) || null;
    const dueDate = (ext.due_date as string) || null;

    await supabase.from("emi_entries").insert({
      tenant_id: tenantId,
      user_id: userId,
      email_id: emailId,
      lender_name: lender,
      emi_amount: emiAmount,
      next_due_date: dueDate,
      status: "active",
    });
  } else if (
    ["upi_neft", "bank_alert", "credit_card_bill", "bank_statement"].includes(subcategory)
  ) {
    const amount = (ext.amount as number) || 0;
    const bankName = (ext.bank_name as string) || null;
    const merchant = (ext.merchant as string) || null;
    const txnDate = (ext.transaction_date as string) || new Date().toISOString().split("T")[0];
    const txnType = (ext.transaction_type as string) || "debit";

    await supabase.from("bank_transactions").insert({
      tenant_id: tenantId,
      user_id: userId,
      email_id: emailId,
      transaction_date: txnDate,
      amount: Math.abs(amount),
      transaction_type: txnType,
      bank_name: bankName,
      merchant: merchant,
      payment_mode: (ext.payment_mode as string) || subcategory,
    });
  } else if (["sip_confirmation", "sip_statement"].includes(subcategory)) {
    const fundName = (ext.fund_name as string) || "Mutual Fund";
    const sipAmount = (ext.sip_amount as number) || (ext.amount as number) || null;
    const nav = (ext.nav as number) || null;
    const units = (ext.units as number) || null;

    // Upsert sip_entries by matching user_id + fund_name
    const { data: existing } = await supabase
      .from("sip_entries")
      .select("id")
      .eq("user_id", userId)
      .eq("fund_name", fundName)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from("sip_entries")
        .update({
          email_id: emailId,
          sip_amount: sipAmount,
          nav: nav,
          units_allotted: units,
          statement_date: new Date().toISOString().split("T")[0],
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing[0].id);
    } else {
      await supabase.from("sip_entries").insert({
        tenant_id: tenantId,
        user_id: userId,
        email_id: emailId,
        fund_name: fundName,
        sip_amount: sipAmount,
        nav: nav,
        units_allotted: units,
        statement_date: new Date().toISOString().split("T")[0],
      });
    }
  } else if (subcategory === "cas_statement") {
    const funds = Array.isArray(ext.funds) ? ext.funds : [];
    for (const fund of funds) {
      const fName = (fund.fund_name as string) || "Mutual Fund";
      const fNav = (fund.nav as number) || null;
      const fUnits = (fund.units as number) || null;

      const { data: existing } = await supabase
        .from("sip_entries")
        .select("id")
        .eq("user_id", userId)
        .eq("fund_name", fName)
        .limit(1);

      if (existing && existing.length > 0) {
        await supabase
          .from("sip_entries")
          .update({
            email_id: emailId,
            nav: fNav,
            units_allotted: fUnits,
            statement_date: new Date().toISOString().split("T")[0],
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing[0].id);
      } else {
        await supabase.from("sip_entries").insert({
          tenant_id: tenantId,
          user_id: userId,
          email_id: emailId,
          fund_name: fName,
          nav: fNav,
          units_allotted: fUnits,
          statement_date: new Date().toISOString().split("T")[0],
        });
      }
    }
  }
}

// ── Helper 2: Career Data Insertion ───────────────────────────────────────────
async function insertCareerData(
  emailId: string,
  userId: string,
  tenantId: string,
  subcategory: string,
  extractedData: Record<string, unknown> | undefined,
  supabase: SupabaseClient
) {
  const ext = extractedData || {};

  const company = (ext.company as string) || (ext.company_name as string) || "Unknown Company";
  const role = (ext.role as string) || (ext.role_title as string) || null;
  const portfolioLinks = Array.isArray(ext.portfolio_links) ? (ext.portfolio_links as string[]) : [];
  const assessmentLinks = Array.isArray(ext.assessment_links) ? (ext.assessment_links as string[]) : [];

  let stage: "applied" | "interviewing" | "offered" | "rejected" = "applied";

  if (subcategory === "offer_letter") {
    stage = "offered";
    const ctcLpa = (ext.ctc_lpa as number) || (ext.salary_lpa as number) || null;
    const joiningDate = (ext.joining_date as string) || null;

    await supabase.from("offer_letters").insert({
      tenant_id: tenantId,
      user_id: userId,
      email_id: emailId,
      company_name: company,
      role_title: role,
      ctc_lpa: ctcLpa,
      joining_date: joiningDate,
      status: "pending",
    });
  } else if (subcategory === "interview_invite") {
    stage = "interviewing";
  } else if (subcategory === "rejection") {
    stage = "rejected";
  } else if (subcategory === "application_status") {
    stage = "applied";
  }

  // Upsert job_applications on (user_id + company_name)
  const { data: existingApp } = await supabase
    .from("job_applications")
    .select("id")
    .eq("user_id", userId)
    .eq("company_name", company)
    .limit(1);

  if (existingApp && existingApp.length > 0) {
    await supabase
      .from("job_applications")
      .update({
        email_id: emailId,
        role_title: role ?? undefined,
        current_stage: stage,
        portfolio_links: portfolioLinks.length > 0 ? portfolioLinks : undefined,
        assessment_links: assessmentLinks.length > 0 ? assessmentLinks : undefined,
        last_activity: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingApp[0].id);
  } else {
    await supabase.from("job_applications").insert({
      tenant_id: tenantId,
      user_id: userId,
      email_id: emailId,
      company_name: company,
      role_title: role,
      current_stage: stage,
      portfolio_links: portfolioLinks,
      assessment_links: assessmentLinks,
      last_activity: new Date().toISOString(),
    });
  }
}

// ── Helper 3: Meeting Data Insertion ──────────────────────────────────────────
async function insertMeetingData(
  emailId: string,
  userId: string,
  tenantId: string,
  extractedData: Record<string, unknown> | undefined,
  supabase: SupabaseClient
) {
  const ext = extractedData || {};

  const title = (ext.title as string) || (ext.subject as string) || "Meeting Invite";
  const meetingTime = (ext.meeting_time as string) || (ext.start_time as string) || null;
  const meetingLink = (ext.meeting_link as string) || (ext.link as string) || null;
  const icalUid = (ext.ical_uid as string) || null;

  let platform = "other";
  if (meetingLink) {
    if (meetingLink.includes("meet.google.com")) platform = "meet";
    else if (meetingLink.includes("zoom.us")) platform = "zoom";
    else if (meetingLink.includes("teams.")) platform = "teams";
  }

  if (icalUid) {
    const { data: existing } = await supabase
      .from("meetings")
      .select("id")
      .eq("ical_uid", icalUid)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from("meetings")
        .update({
          email_id: emailId,
          title,
          start_time: meetingTime,
          meeting_link: meetingLink,
          platform,
        })
        .eq("id", existing[0].id);
      return;
    }
  }

  // Fallback match on (user_id + title + start_time)
  if (meetingTime) {
    const { data: existing } = await supabase
      .from("meetings")
      .select("id")
      .eq("user_id", userId)
      .eq("title", title)
      .eq("start_time", meetingTime)
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase
        .from("meetings")
        .update({
          email_id: emailId,
          meeting_link: meetingLink,
          platform,
        })
        .eq("id", existing[0].id);
      return;
    }
  }

  await supabase.from("meetings").insert({
    tenant_id: tenantId,
    user_id: userId,
    email_id: emailId,
    title,
    start_time: meetingTime,
    meeting_link: meetingLink,
    platform,
    ical_uid: icalUid,
    status: "upcoming",
  });
}

// ── Main Route Handler ────────────────────────────────────────────────────────
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

  const parsed = processChunkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { job_id, chunk_size } = parsed.data;
  const db = createServerClient();

  // 1. Fetch batch job
  const { data: job, error: jobErr } = await db
    .from("batch_jobs")
    .select("id, user_id, tenant_id, gmail_account_id, status, total_emails, processed_count, current_page_token, date_from, date_to, started_at")
    .eq("id", job_id)
    .single();

  if (jobErr || !job) {
    return NextResponse.json({ error: "batch_job_not_found" }, { status: 404 });
  }

  // 2. Mark job processing & set started_at if first chunk
  const updates: Record<string, unknown> = { status: "processing" };
  if (!job.started_at) {
    updates.started_at = new Date().toISOString();
  }
  await db.from("batch_jobs").update(updates).eq("id", job_id);

  // 3. Fetch gmail account details and active token
  const { data: account, error: accErr } = await db
    .from("gmail_accounts")
    .select("id, access_token, refresh_token, token_expiry")
    .eq("id", job.gmail_account_id)
    .single();

  if (accErr || !account) {
    await db.from("batch_jobs").update({ status: "failed" }).eq("id", job_id);
    return NextResponse.json({ error: "gmail_account_not_found" }, { status: 404 });
  }

  let accessToken: string;
  try {
    const refreshed = await refreshAccessToken(account.refresh_token as string);
    accessToken = refreshed.access_token;
    await db
      .from("gmail_accounts")
      .update({
        access_token: refreshed.encrypted_access_token,
        token_expiry: refreshed.expiry.toISOString(),
      })
      .eq("id", job.gmail_account_id);
  } catch {
    accessToken = decryptToken(account.access_token as string);
  }

  // 4. Fetch chunk of emails from Gmail API
  let queryStr = `after:${job.date_from}`;
  if (job.date_to) {
    queryStr += ` before:${job.date_to}`;
  }

  let listRes;
  try {
    listRes = await getEmailList(accessToken, {
      query: queryStr,
      maxResults: chunk_size,
      pageToken: job.current_page_token || undefined,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "gmail_fetch_failed";
    return NextResponse.json({ error: "gmail_fetch_failed", details: msg }, { status: 500 });
  }

  const messages = listRes.messages;
  const nextPageToken = listRes.nextPageToken || null;
  let processedThisChunk = 0;

  // 5. Process each message
  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];

    // a. Skip if already processed in emails table
    const { data: existing } = await db
      .from("emails")
      .select("id")
      .eq("gmail_account_id", job.gmail_account_id)
      .eq("message_id", msg.id)
      .limit(1);

    if (existing && existing.length > 0) {
      processedThisChunk++;
      continue;
    }

    try {
      // b. Fetch full email detail
      const detail = await getEmailDetail(accessToken, msg.id);

      // c. Prepare input for classifier
      const emailInput: EmailInput = {
        from_email: detail.fromEmail,
        from_name: detail.fromName,
        subject: detail.subject,
        snippet: detail.snippet,
        body_text: detail.bodyText,
        body_html: detail.bodyHtml,
        received_at: detail.receivedAt,
        body_preview: detail.bodyText.slice(0, 500),
      };

      // d. Run classification
      const classification = await classifyEmail(emailInput);

      // e. Upsert into emails table
      const { data: insertedEmail, error: insertErr } = await db
        .from("emails")
        .upsert(
          {
            gmail_account_id: job.gmail_account_id,
            user_id: job.user_id,
            tenant_id: job.tenant_id,
            message_id: detail.messageId,
            thread_id: detail.threadId,
            subject: detail.subject,
            from_email: detail.fromEmail,
            from_name: detail.fromName,
            to_email: detail.toEmail,
            cc_email: detail.ccEmail,
            received_at: detail.receivedAt.toISOString(),
            snippet: detail.snippet,
            body_text: detail.bodyText,
            body_html: detail.bodyHtml,
            labels: detail.labels,
            category: classification.category,
            subcategory: classification.subcategory,
            confidence: classification.confidence,
            classification_tier: classification.tier,
            ai_summary: classification.ai_summary ?? null,
            extracted_data: classification.extracted_data ?? null,
            has_action_item: classification.has_action_item,
          },
          { onConflict: "gmail_account_id,message_id" }
        )
        .select("id")
        .single();

      if (!insertErr && insertedEmail) {
        const emailId = insertedEmail.id;
        const cat = classification.category.toLowerCase();
        const subcat = classification.subcategory.toLowerCase();

        // f. Module insertions based on category
        if (["finance", "investments"].includes(cat)) {
          await insertFinancialData(
            emailId,
            job.user_id,
            job.tenant_id,
            subcat,
            classification.extracted_data,
            db
          );
        } else if (["career", "jobs", "offers"].includes(cat)) {
          await insertCareerData(
            emailId,
            job.user_id,
            job.tenant_id,
            subcat,
            classification.extracted_data,
            db
          );
        } else if (cat === "meetings") {
          await insertMeetingData(
            emailId,
            job.user_id,
            job.tenant_id,
            classification.extracted_data,
            db
          );
        }

        // g. Insert action items if present
        if (classification.has_action_item && classification.action_items) {
          for (const item of classification.action_items) {
            await db.from("action_items").insert({
              tenant_id: job.tenant_id,
              user_id: job.user_id,
              email_id: emailId,
              type: item.type || "action_required",
              title: detail.subject,
              description: item.description,
              due_date: item.due_date ? new Date(item.due_date).toISOString() : null,
              is_completed: false,
            });
          }
        }
      }

      processedThisChunk++;
    } catch (err) {
      console.error(`Failed to process message ${msg.id}:`, err);
    }

    // Rate limit discipline: pause 1s after every 5 emails processed
    if ((i + 1) % 5 === 0) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  // 6. Update batch_job status and token
  const updatedProcessedCount = (job.processed_count || 0) + processedThisChunk;
  const isComplete = !nextPageToken;

  await db
    .from("batch_jobs")
    .update({
      processed_count: updatedProcessedCount,
      current_page_token: nextPageToken,
      status: isComplete ? "completed" : "processing",
      completed_at: isComplete ? new Date().toISOString() : null,
    })
    .eq("id", job_id);

  return NextResponse.json({
    job_id,
    processed_this_chunk: processedThisChunk,
    next_page_token: nextPageToken,
    is_complete: isComplete,
    total_processed: updatedProcessedCount,
    total_emails: job.total_emails,
  });
}
