/**
 * Tier 1 rule-based email classifier.
 * Pure TypeScript — no imports, no async, executes in <1ms.
 * Returns FIRST matching rule or null.
 */

export interface EmailInput {
  from_email: string;
  from_name?: string;
  subject: string;
  snippet?: string;
  labels?: string[];
}

export interface ClassificationResult {
  category: string;
  subcategory: string;
  confidence: number;
  tier: "regex";
  extracted_data?: Record<string, unknown>;
  has_action_item?: boolean;
}

// ── Domain lists ─────────────────────────────────────────────────────────────

export const FINANCE_DOMAINS: string[] = [
  "hdfcbank.com",
  "icicibank.com",
  "axisbank.com",
  "sbi.co.in",
  "kotak.com",
  "yesbank.in",
  "federalbank.co.in",
  "canarabank.in",
  "indusind.com",
  "rblbank.com",
  "pnbindia.in",
  "paytm.com",
  "phonepe.com",
  "razorpay.com",
  "bharatpe.com",
  "mobikwik.com",
  "billdesk.com",
  "ccavenue.com",
  "easebuzz.com",
];

const INVESTMENT_DOMAINS: string[] = [
  "camsonline.com",
  "karvyfintech.com",
  "nsdl.co.in",
  "cdslindia.com",
  "zerodha.com",
  "groww.in",
  "upstox.com",
  "angelone.in",
  "icicidirect.com",
  "miraeasset.in",
  "hdfcfund.com",
  "sbimf.com",
  "nipponindiaim.com",
  "axismf.com",
  "kotakmahindraamc.com",
  "paytmmoney.com",
  "smallcase.com",
  "fisdom.com",
  "kuvera.in",
  "coin.zerodha.com",
];

const JOB_DOMAINS: string[] = [
  "lever.co",
  "greenhouse.io",
  "workday.com",
  "taleo.com",
  "successfactors.com",
  "naukri.com",
  "linkedin.com",
  "indeed.com",
  "unstop.com",
  "hirist.com",
  "foundit.in",
  "internshala.com",
  "wellfound.com",
  "cutshort.io",
  "instahyre.com",
  "iimjobs.com",
  "freshteam.com",
  "zoho.com",
  "breezy.hr",
  "smartrecruiters.com",
  "recruitee.com",
];

// ── Helpers ──────────────────────────────────────────────────────────────────

function hasDomain(email: string, domains: string[]): boolean {
  const lc = email.toLowerCase();
  return domains.some((d) => lc.includes(d));
}

function matchSubject(subject: string, patterns: [RegExp, string][]): string | null {
  for (const [re, sub] of patterns) {
    if (re.test(subject)) return sub;
  }
  return null;
}

// ── Finance subject patterns ─────────────────────────────────────────────────

const FINANCE_SUBJECT_PATTERNS: [RegExp, string][] = [
  [/EMI\s*(due|debit|receipt|paid|processed)/i, "emi_payment"],
  [/auto.?debit|nach\s*(debit|mandate)/i, "emi_payment"],
  [/credit\s*card\s*(statement|bill|due|payment|outstanding)/i, "credit_card_bill"],
  [/balance\s*conversion|emi\s*conversion/i, "credit_card_bill"],
  [/a\/c\s*(x+\d+\s*)?(credited|debited)|account\s*(credited|debited)/i, "bank_alert"],
  [/UPI\s*(credit|debit|transaction|ref)/i, "upi_neft"],
  [/NEFT|RTGS|IMPS|fund\s*transfer/i, "upi_neft"],
  [/mini\s*statement|account\s*statement|e-statement/i, "bank_statement"],
  [/loan\s*(disburs|sanctioned|approved)/i, "loan_offer"],
  [/personal\s*loan\s*offer|pre-?approved\s*loan/i, "loan_offer"],
  [/insurance\s*(premium|renewal|policy|due)/i, "insurance"],
];

// ── Investment subject patterns ───────────────────────────────────────────────

const INVESTMENT_SUBJECT_PATTERNS: [RegExp, string][] = [
  [/SIP\s*(confirmation|successful|executed|processed|alert)/i, "sip_confirmation"],
  [/SIP\s*(statement|report|summary)/i, "sip_statement"],
  [/mutual\s*fund|ELSS|folio/i, "sip_statement"],
  [/CAS|consolidated\s*account\s*statement/i, "cas_statement"],
  [/stock\s*(buy|purchase|sold|order)|shares?\s*(bought|sold|purchased)/i, "stock_purchase"],
  [/order\s*(executed|confirmed|placed).*(stock|share|equity)/i, "stock_purchase"],
  [/dividend\s*(credit|declared|paid)/i, "dividend_alert"],
  [/demat\s*(statement|account|alert|holding)/i, "demat_statement"],
  [/NAV\s*(update|change)|net\s*asset\s*value/i, "nav_update"],
  [/portfolio\s*(update|statement|summary)/i, "portfolio_update"],
];

// ── Job subject patterns ──────────────────────────────────────────────────────

const JOB_SUBJECT_PATTERNS: [RegExp, string][] = [
  [/UI.?UX|user\s*interface|interaction\s*design|product\s*designer/i, "uiux_role"],
  [/frontend\s*(developer|engineer)|react\s*(developer|engineer)|next\.?js/i, "engineering_role"],
  [/full.?stack|backend\s*(developer|engineer)|node\.?js/i, "engineering_role"],
  [/visual\s*design|graphic\s*design|brand\s*design/i, "design_role"],
  [/product\s*manager|program\s*manager/i, "product_role"],
  [/new\s*job.*match|jobs?\s*(alert|matching)/i, "job_alert_digest"],
  [/application\s*(received|submitted|confirmed)|applied\s*successfully/i, "application_status"],
  [/referral\s*(update|received|submitted)/i, "referral"],
];

// ── Main classifier ───────────────────────────────────────────────────────────

export function classifyByRules(email: EmailInput): ClassificationResult | null {
  const subject = email.subject ?? "";
  const fromEmail = email.from_email ?? "";
  const labels = email.labels ?? [];

  // ── RULE SET 1: Finance ────────────────────────────────────────────────────
  if (hasDomain(fromEmail, FINANCE_DOMAINS)) {
    const refined = matchSubject(subject, FINANCE_SUBJECT_PATTERNS);
    return {
      category: "finance",
      subcategory: refined ?? "bank_alert",
      confidence: 0.95,
      tier: "regex",
    };
  }

  // Finance subject-only check (even without matching sender)
  const financeSubMatch = matchSubject(subject, FINANCE_SUBJECT_PATTERNS);
  if (financeSubMatch) {
    return {
      category: "finance",
      subcategory: financeSubMatch,
      confidence: 0.85,
      tier: "regex",
    };
  }

  // ── RULE SET 2: Investments ────────────────────────────────────────────────
  if (hasDomain(fromEmail, INVESTMENT_DOMAINS)) {
    const refined = matchSubject(subject, INVESTMENT_SUBJECT_PATTERNS);
    return {
      category: "investments",
      subcategory: refined ?? "portfolio_update",
      confidence: 0.95,
      tier: "regex",
    };
  }

  const investmentSubMatch = matchSubject(subject, INVESTMENT_SUBJECT_PATTERNS);
  if (investmentSubMatch) {
    return {
      category: "investments",
      subcategory: investmentSubMatch,
      confidence: 0.85,
      tier: "regex",
    };
  }

  // ── RULE SET 3: Jobs ───────────────────────────────────────────────────────
  if (hasDomain(fromEmail, JOB_DOMAINS)) {
    const refined = matchSubject(subject, JOB_SUBJECT_PATTERNS);
    return {
      category: "jobs",
      subcategory: refined ?? "job_alert_digest",
      confidence: 0.92,
      tier: "regex",
    };
  }

  const jobSubMatch = matchSubject(subject, JOB_SUBJECT_PATTERNS);
  if (jobSubMatch) {
    return {
      category: "jobs",
      subcategory: jobSubMatch,
      confidence: 0.8,
      tier: "regex",
    };
  }

  // ── RULE SET 4: Career Events ──────────────────────────────────────────────
  const careerPatterns: [RegExp, string][] = [
    [/offer\s*letter|pleased\s*to\s*offer|job\s*offer/i, "offer_letter"],
    [/congratulations.*offer|we.?d\s*like\s*to\s*offer/i, "offer_letter"],
    [/interview\s*(invite|invitation|scheduled|schedule|confirmed|confirmation)/i, "interview_invite"],
    [/technical\s*(round|interview)|hr\s*(round|interview)/i, "interview_invite"],
    [/assessment|coding\s*(test|challenge|round)|hackerrank|technical\s*task/i, "assessment_link"],
    [/portfolio\s*(review|submission|request)/i, "portfolio_request"],
    [/unfortunately|not\s*moving\s*forward|regret\s*to\s*inform|not\s*selected/i, "rejection"],
  ];

  const careerMatch = matchSubject(subject, careerPatterns);
  if (careerMatch) {
    return {
      category: "career",
      subcategory: careerMatch,
      confidence: 0.9,
      tier: "regex",
    };
  }

  // ── RULE SET 5: Meetings ───────────────────────────────────────────────────
  const meetingSubjectPatterns: RegExp[] = [
    /meeting\s*(invite|invitation|request|scheduled|confirmed)/i,
    /calendar\s*invite|you.?re\s*invited\s*to/i,
    /google\s*meet|zoom\.us|teams\.microsoft|webex/i,
    /call\s*(scheduled|invite|invitation)/i,
  ];

  const hasCalendarLabel = labels.some((l) => l.toUpperCase().includes("CALENDAR"));
  const meetingSubjectMatch = meetingSubjectPatterns.some((re) => re.test(subject));

  if (meetingSubjectMatch || hasCalendarLabel) {
    return {
      category: "meetings",
      subcategory: "meeting_invite",
      confidence: 0.92,
      tier: "regex",
    };
  }

  // ── RULE SET 6: System / Action ────────────────────────────────────────────
  const systemPatterns: [RegExp, string, boolean][] = [
    [/\bOTP\b|one.?time\s*(password|pin|code)|verification\s*code/i, "otp_verification", true],
    [/verify\s*(your|this)\s*(email|account|number|phone)/i, "otp_verification", true],
    [/action\s*required|immediate\s*action|urgent\s*action/i, "action_required", true],
    [/subscription\s*(expir|renew|cancel)/i, "subscription_alert", false],
    [/demat.*annual.*maintenance|AMC\s*(due|charge)/i, "demat_alert", false],
  ];

  for (const [re, subcategory, hasAction] of systemPatterns) {
    if (re.test(subject)) {
      return {
        category: "system",
        subcategory,
        confidence: 0.9,
        tier: "regex",
        has_action_item: hasAction,
      };
    }
  }

  return null;
}

// ── Monitoring ────────────────────────────────────────────────────────────────

export function getRuleStats(): { totalRuleSets: number; categories: string[] } {
  return {
    totalRuleSets: 6,
    categories: ["finance", "investments", "jobs", "career", "meetings", "system"],
  };
}
