// ── UI-layer types (pre-existing, used by EmailRow + useEmailStore) ───────────

export interface EmailItem {
  id: string;
  sender: string;
  email: string;
  subject: string;
  snippet: string;
  date: string;
  category: string;
  isUnread: boolean;
  isUrgent?: boolean;
  amount?: string;
  meetingTime?: string;
  location?: string;
  attachments?: string[];
}

// ── Enums (matching DB schema string unions) ──────────────────────────────────

export type EmailCategory =
  | "finance"
  | "finance_transaction"
  | "investments"
  | "jobs"
  | "career"
  | "meetings"
  | "offers"
  | "ads"
  | "social"
  | "newsletter"
  | "otp"
  | "system"
  | "misc";

export type EmailSubcategory =
  | "emi_payment"
  | "bank_alert"
  | "upi_neft"
  | "credit_card_bill"
  | "insurance"
  | "bank_statement"
  | "loan_offer"
  | "sip_confirmation"
  | "sip_statement"
  | "stock_purchase"
  | "portfolio_update"
  | "dividend_alert"
  | "demat_statement"
  | "cas_statement"
  | "nav_update"
  | "uiux_role"
  | "engineering_role"
  | "design_role"
  | "product_role"
  | "recruiter_outreach"
  | "job_alert_digest"
  | "application_status"
  | "referral"
  | "offer_letter"
  | "interview_invite"
  | "assessment_link"
  | "rejection"
  | "portfolio_request"
  | "meeting_invite"
  | "meeting_update"
  | "otp_verification"
  | "workspace_notification"
  | "platform_digest"
  | "action_required"
  | "subscription_alert"
  | "demat_alert"
  | "promo_discount"
  | "subscription_renewal"
  | "order_confirmation"
  | "linkedin_notification"
  | "newsletter"
  | "event_invite"
  | "unknown";

export type ClassificationTier = "regex" | "huggingface" | "gemini" | "manual";

// ── ParsedEmail ───────────────────────────────────────────────────────────────

export interface ParsedEmail {
  messageId: string;
  threadId: string;
  subject: string;
  fromEmail: string;
  fromName: string;
  toEmail: string[];
  ccEmail: string[];
  receivedAt: Date;
  snippet: string;
  bodyText: string;
  bodyHtml: string;
  labels: string[];
  attachments: Array<{
    name: string;
    mimeType: string;
    size: number;
    attachmentId: string;
  }>;
  rawHeaders: Record<string, string>;
}

// ── ClassificationOutput ──────────────────────────────────────────────────────

export interface ClassificationOutput {
  category: EmailCategory | string;
  subcategory: EmailSubcategory | string;
  confidence: number;
  tier: ClassificationTier;
  ai_summary?: string;
  extracted_data?: Record<string, unknown>;
  has_action_item: boolean;
  action_items?: Array<{
    type: string;
    description: string;
    due_date?: string;
  }>;
  deferred?: boolean;
}

// ── DB Table Shapes ───────────────────────────────────────────────────────────

export interface GmailAccount {
  id: string;
  user_id: string;
  tenant_id: string;
  email: string;
  display_name: string;
  access_token: string;      // encrypted
  refresh_token: string;     // encrypted
  token_expiry: string;      // ISO datetime
  history_id: string | null;
  watch_expiry: string | null;
  sync_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface Email {
  id: string;
  gmail_account_id: string;
  user_id: string;
  tenant_id: string;
  message_id: string;
  thread_id: string;
  subject: string;
  from_email: string;
  from_name: string;
  to_email: string[];
  cc_email: string[];
  received_at: string;
  snippet: string;
  body_text: string;
  body_html: string;
  labels: string[];
  category: EmailCategory | string;
  subcategory: EmailSubcategory | string;
  confidence: number;
  classification_tier: ClassificationTier;
  ai_summary: string | null;
  extracted_data: Record<string, unknown> | null;
  has_action_item: boolean;
  created_at: string;
}

export interface BatchJob {
  id: string;
  tenant_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  total_messages: number;
  processed_messages: number;
  failed_messages: number;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface EMIEntry {
  id: string;
  email_id: string;
  user_id: string;
  tenant_id: string;
  lender: string | null;
  emi_amount: number | null;
  tenure_remaining: number | null;
  due_date: string | null;
  payment_mode: string | null;
  created_at: string;
}

export interface SIPEntry {
  id: string;
  email_id: string;
  user_id: string;
  tenant_id: string;
  subcategory: string;
  fund_name: string | null;
  sip_amount: number | null;
  nav: number | null;
  units: number | null;
  created_at: string;
}

export interface BankTransaction {
  id: string;
  email_id: string;
  user_id: string;
  tenant_id: string;
  subcategory: string;
  amount: number | null;
  bank_name: string | null;
  payment_mode: string | null;
  transaction_date: string | null;
  merchant: string | null;
  created_at: string;
}

export interface JobApplication {
  id: string;
  email_id: string;
  user_id: string;
  tenant_id: string;
  subcategory: string;
  company: string | null;
  role: string | null;
  salary_lpa: number | null;
  joining_date: string | null;
  portfolio_links: string[];
  created_at: string;
}

export interface PendingQueueItem {
  id: string;
  gmail_account_id: string;
  tenant_id: string;
  message_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  arrived_at: string;
  processed_at: string | null;
}
