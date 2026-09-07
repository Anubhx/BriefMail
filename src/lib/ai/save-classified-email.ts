import { createServiceClient } from "@/lib/supabase/server";
import { ClassificationOutput } from "./classify-pipeline";
import { compressHtml } from "@/lib/utils/html-compress";

export interface SaveEmailParams {
  gmailAccountId: string;
  userId: string;
  tenantId: string;
  messageId: string;
  threadId?: string;
  fromEmail: string;
  fromName?: string;
  toEmail?: string[];
  ccEmail?: string[];
  subject: string;
  snippet?: string;
  bodyText?: string;
  bodyHtml?: string;
  receivedAt: Date;
  labels?: string[];
  classification: ClassificationOutput;
  queueItemId?: string;
}

export async function saveClassifiedEmail(params: SaveEmailParams): Promise<string | null> {
  const db = createServiceClient();
  const {
    gmailAccountId,
    userId,
    tenantId,
    messageId,
    threadId,
    fromEmail,
    fromName,
    toEmail = [],
    ccEmail = [],
    subject,
    snippet = "",
    bodyText = "",
    bodyHtml = "",
    receivedAt,
    labels = [],
    classification,
    queueItemId,
  } = params;

  // 1. Upsert into core emails table (body_html is compressed; snippet capped at 500 chars)
  const { data: insertedEmail, error: emailErr } = await db
    .from("emails")
    .upsert(
      {
        gmail_account_id: gmailAccountId,
        user_id: userId,
        tenant_id: tenantId,
        message_id: messageId,
        thread_id: threadId ?? null,
        from_email: fromEmail,
        from_name: fromName ?? null,
        to_email: toEmail,
        cc_email: ccEmail,
        subject: subject,
        snippet: snippet.slice(0, 500),
        body_text: bodyText,
        body_html: compressHtml(bodyHtml),
        received_at: receivedAt.toISOString(),
        labels: labels,
        category: classification.category,
        subcategory: classification.subcategory,
        classification_tier: classification.tier,
        confidence_score: classification.confidence,
        ai_summary: classification.ai_summary ?? null,
        extracted_data: classification.extracted_data ?? {},
        has_action_item: classification.has_action_item ?? false,
        action_items: classification.action_items ?? [],
        is_archived: classification.category === "ads" ? true : false,
        is_read: classification.category === "ads" ? true : false,
      },
      { onConflict: "gmail_account_id,message_id" }
    )
    .select("id")
    .single();

  if (emailErr || !insertedEmail) {
    console.error("Failed to insert/upsert into emails table:", emailErr);
    return null;
  }

  const emailId = insertedEmail.id as string;
  const cat = (classification.category || "").toLowerCase();
  const subcat = (classification.subcategory || "").toLowerCase();
  const ext = classification.extracted_data || {};

  // 2. Insert into specialized domain tables
  try {
    // 2A. Finance & Investments
    if (subcat === "emi_payment") {
      const lender = (ext.lender as string) || (ext.merchant as string) || "Unknown Lender";
      const emiAmount = (ext.emi_amount as number) || (ext.amount as number) || null;
      const dueDate = (ext.due_date as string) || (ext.action_due as string) || null;

      await db.from("emi_entries").insert({
        tenant_id: tenantId,
        user_id: userId,
        email_id: emailId,
        lender_name: lender,
        emi_amount: emiAmount,
        next_due_date: dueDate ? dueDate.split("T")[0] : null,
        status: "active",
      });
    } else if (
      ["upi_neft", "bank_alert", "credit_card_bill", "bank_statement", "finance", "finance_transaction"].includes(cat) ||
      ["upi_neft", "bank_alert", "credit_card_bill", "bank_statement"].includes(subcat)
    ) {
      const amount = typeof ext.amount === "number" ? Math.abs(ext.amount) : 0;
      const txnType = (ext.transaction_type as string) || (amount < 0 ? "debit" : "debit");
      const txnDate = (ext.transaction_date as string) || receivedAt.toISOString().split("T")[0];

      await db.from("bank_transactions").insert({
        tenant_id: tenantId,
        user_id: userId,
        email_id: emailId,
        transaction_date: txnDate.split("T")[0],
        amount: amount,
        transaction_type: txnType === "credit" ? "credit" : "debit",
        bank_name: (ext.bank_name as string) || null,
        merchant: (ext.merchant as string) || null,
        payment_mode: (ext.payment_mode as string) || subcat || "bank",
        description: subject,
      });
    } else if (["sip_confirmation", "sip_statement", "investments"].includes(cat) || ["sip_confirmation", "sip_statement"].includes(subcat)) {
      const fundName = (ext.fund_name as string) || (ext.merchant as string) || "Mutual Fund";
      const sipAmount = typeof ext.sip_amount === "number" ? ext.sip_amount : typeof ext.amount === "number" ? ext.amount : null;
      const nav = typeof ext.nav === "number" ? ext.nav : null;
      const units = typeof ext.units === "number" ? ext.units : null;

      await db.from("sip_entries").insert({
        tenant_id: tenantId,
        user_id: userId,
        email_id: emailId,
        fund_name: fundName,
        sip_amount: sipAmount,
        nav: nav,
        units_allotted: units,
        statement_date: receivedAt.toISOString().split("T")[0],
      });
    }

    // 2B. Career & Jobs (Only real job applications and career milestones; NOT job alerts)
    const isJobApp =
      subcat === "job_application" ||
      ["offer_letter", "interview_invite", "application_status", "rejection"].includes(subcat);

    if (isJobApp) {
      const company = (ext.company as string) || (ext.company_name as string) || fromName || "Unknown Company";
      const role = (ext.role as string) || (ext.role_title as string) || subject;
      const portfolioLinks = Array.isArray(ext.portfolio_links) ? ext.portfolio_links : [];
      const assessmentLinks = Array.isArray(ext.assessment_links) ? ext.assessment_links : [];

      let stage: "applied" | "interviewing" | "offered" | "rejected" = "applied";
      if (subcat === "offer_letter") stage = "offered";
      else if (subcat === "interview_invite") stage = "interviewing";
      else if (subcat === "rejection") stage = "rejected";

      if (subcat === "offer_letter") {
        const ctcLpa = typeof ext.salary_lpa === "number" ? ext.salary_lpa : typeof ext.ctc_lpa === "number" ? ext.ctc_lpa : null;
        await db.from("offer_letters").insert({
          tenant_id: tenantId,
          user_id: userId,
          email_id: emailId,
          company_name: company,
          role_title: role,
          ctc_lpa: ctcLpa,
          joining_date: (ext.joining_date as string) ? (ext.joining_date as string).split("T")[0] : null,
          status: "pending",
        });
      }

      await db.from("job_applications").insert({
        tenant_id: tenantId,
        user_id: userId,
        email_id: emailId,
        company_name: company,
        role_title: role,
        current_stage: stage,
        portfolio_links: portfolioLinks,
        assessment_links: assessmentLinks,
        last_activity: receivedAt.toISOString(),
      });
    }

    // 2C. Meetings
    if (cat === "meetings" || subcat === "meeting_invite") {
      const title = (ext.title as string) || subject || "Meeting";
      const meetingTime = (ext.meeting_time as string) || (ext.start_time as string) || null;
      const meetingLink = (ext.meeting_link as string) || (ext.link as string) || null;
      let platform = (ext.platform as string) || "other";
      if (meetingLink) {
        if (meetingLink.includes("meet.google.com")) platform = "meet";
        else if (meetingLink.includes("zoom.us")) platform = "zoom";
        else if (meetingLink.includes("teams.")) platform = "teams";
      }

      await db.from("meetings").insert({
        tenant_id: tenantId,
        user_id: userId,
        email_id: emailId,
        title: title,
        start_time: meetingTime ? new Date(meetingTime).toISOString() : null,
        meeting_link: meetingLink,
        platform: platform,
        status: "upcoming",
      });
    }

    // 2D. Action items
    if (classification.has_action_item && classification.action_items?.length) {
      for (const item of classification.action_items) {
        await db.from("action_items").insert({
          tenant_id: tenantId,
          user_id: userId,
          email_id: emailId,
          type: item.type || "action_required",
          title: subject,
          description: item.description || classification.ai_summary || "Action required from email",
          due_date: item.due_date ? new Date(item.due_date).toISOString() : null,
          is_completed: false,
        });
      }
    }
  } catch (subTableErr) {
    console.warn("Non-fatal error inserting specialized sub-table data:", subTableErr);
  }

  // 3. Update pending_queue item if queueItemId is provided or matching message_id
  try {
    if (queueItemId) {
      await db
        .from("pending_queue")
        .update({
          status: "completed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", queueItemId);
    }

    // Also mark any pending_queue row matching this gmail_account_id & message_id
    await db
      .from("pending_queue")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
      })
      .eq("gmail_account_id", gmailAccountId)
      .eq("message_id", messageId);
  } catch (qErr) {
    console.warn("Failed to update pending_queue status:", qErr);
  }

  return emailId;
}
