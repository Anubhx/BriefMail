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

export const FINANCE_TRANSACTION_DOMAINS: string[] = [
  "hdfcbank.com",
  "icicibank.com",
  "axisbank.com",
  "sbi.co.in",
  "kotak.com",
  "paytm.com",
  "phonepe.com",
  "gpay.com",
  "razorpay.com",
  "stripe.com",
  "zerodha.com",
  "groww.in",
  "kfintech.com",
  "camsites.com",
  "camsonline.com",
  "karvyfintech.com",
  "billdesk.com",
  "ccavenue.com",
];

export const SOCIAL_DOMAINS: string[] = [
  "linkedin.com",
  "twitter.com",
  "x.com",
  "instagram.com",
  "facebook.com",
  "snapchat.com",
  "youtube.com",
  "reddit.com",
  "quora.com",
  "medium.com",
  "substack.com",
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

// ── OTP Subject Patterns (High Priority) ──────────────────────────────────────

const OTP_SUBJECT_PATTERNS: RegExp[] = [
  /\bOTP\b/i,
  /one\s*time\s*password/i,
  /verification\s*code/i,
  /your\s*code\s*is/i,
  /security\s*code/i,
  /login\s*code/i,
  /authentication\s*code/i,
  /\b2FA\b/i,
  /verify\s*your/i,
];

// ── Ads & Promotional Patterns ────────────────────────────────────────────────

const ADS_SENDER_REGEX = /^(?:noreply|no-reply|marketing|promotions|offers|deals|newsletter)@/i;

const ADS_SUBJECT_PATTERNS: [RegExp, string][] = [
  [/%\s*off/i, "promo_discount"],
  [/\bsale\b/i, "promo_sale"],
  [/\boffer\b/i, "promo_offer"],
  [/\bdiscount\b/i, "promo_discount"],
  [/\bdeal\b/i, "promo_deal"],
  [/limited\s*time/i, "limited_time_offer"],
  [/\bexclusive\b/i, "exclusive_offer"],
  [/\bunsubscribe\b/i, "marketing_unsub"],
  [/\bpromo\b/i, "promo_code"],
  [/\bcashback\b/i, "cashback_offer"],
  [/reward\s*points?/i, "reward_points"],
  [/\bwin\b/i, "contest_win"],
  [/free\s*gift/i, "free_gift"],
  [/click\s*here/i, "cta_promo"],
  [/shop\s*now/i, "cta_shop"],
  [/buy\s*now/i, "cta_buy"],
];

// Bank promotional keywords that should be categorized as 'ads', NOT 'finance'
const BANK_PROMO_KEYWORDS = /\b(offer|reward|cashback|credit\s*card|apply\s*now|pre-?approved)\b/i;

// ── Social Subject Patterns ───────────────────────────────────────────────────

const SOCIAL_SUBJECT_PATTERNS: [RegExp, string][] = [
  [/accepted\s*your/i, "social_accepted"],
  [/connected\s*with\s*you/i, "social_connected"],
  [/commented\s*on/i, "social_comment"],
  [/liked\s*your/i, "social_like"],
  [/followed\s*you/i, "social_follow"],
  [/mentioned\s*you/i, "social_mention"],
  [/sent\s*you\s*a\s*message/i, "social_message"],
  [/\binvitation\b/i, "social_invitation"],
];

// ── Newsletter Subject Patterns ───────────────────────────────────────────────

const NEWSLETTER_SUBJECT_PATTERNS: [RegExp, string][] = [
  [/\bunsubscribe\b/i, "newsletter_unsub"],
  [/view\s*in\s*browser/i, "newsletter_view_browser"],
  [/email\s*preferences/i, "newsletter_prefs"],
  [/manage\s*subscription/i, "newsletter_manage"],
  [/issue\s*#\d+/i, "newsletter_issue"],
  [/weekly\s*digest/i, "weekly_digest"],
  [/monthly\s*update/i, "monthly_update"],
  [/\bnewsletter\b/i, "newsletter_digest"],
];

// ── Finance Transaction Patterns ──────────────────────────────────────────────

const FINANCE_TRANSACTION_SUBJECT_PATTERNS: [RegExp, string][] = [
  [/\bdebited\b/i, "bank_debit"],
  [/\bcredited\b/i, "bank_credit"],
  [/\btransaction\b/i, "bank_transaction"],
  [/payment\s*(received|sent|processed|successful)/i, "payment_status"],
  [/\btransferred\b/i, "fund_transfer"],
  [/\bstatement\b|e-statement|mini\s*statement/i, "bank_statement"],
  [/bill\s*generated/i, "bill_generated"],
  [/\bEMI\b|auto.?debit|nach\s*(debit|mandate)/i, "emi_payment"],
  [/due\s*date/i, "bill_due"],
  [/amount\s*due/i, "amount_due"],
  [/\binvoice\b/i, "invoice"],
  [/\breceipt\b/i, "receipt"],
  [/credit\s*card\s*(statement|bill|due|payment|outstanding)/i, "credit_card_bill"],
  [/balance\s*conversion|emi\s*conversion/i, "credit_card_bill"],
  [/a\/c\s*(x+\d+\s*)?(credited|debited)|account\s*(credited|debited)/i, "bank_alert"],
  [/UPI\s*(credit|debit|transaction|ref)/i, "upi_neft"],
  [/NEFT|RTGS|IMPS|fund\s*transfer/i, "upi_neft"],
  [/insurance\s*(premium|renewal|policy|due)/i, "insurance"],
];

// ── Investment Subject Patterns ───────────────────────────────────────────────

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

// ── Job Subject Patterns (Split: application_confirmed vs job_alert) ───────

const APPLICATION_CONFIRMED_PATTERNS: RegExp[] = [
  /application\s*submitted/i,
  /you\s*applied/i,
  /application\s*received/i,
  /thank\s*you\s*for\s*applying/i,
  /applied\s*for/i,
  /application\s*for/i,
  /we\s*received\s*your\s*application/i,
  /application\s*confirmation/i,
  /applied\s*successfully/i,
];

const JOB_ALERT_SUBJECT_PATTERNS: RegExp[] = [
  /new\s*jobs/i,
  /jobs\s*for\s*you/i,
  /job\s*alert/i,
  /vacancy/i,
  /hiring/i,
  /job\s*opening/i,
  /positions?\s*available/i,
  /jobseeker/i,
  /recommended\s*jobs/i,
  /jobs?\s*matching/i,
  /UI.?UX|user\s*interface|interaction\s*design|product\s*designer/i,
  /frontend\s*(developer|engineer)|react\s*(developer|engineer)|next\.?js/i,
  /full.?stack|backend\s*(developer|engineer)|node\.?js/i,
  /visual\s*design|graphic\s*design|brand\s*design/i,
  /product\s*manager|program\s*manager/i,
  /referral\s*(update|received|submitted)/i,
];

function isJobAlertSender(fromEmail: string, subject: string): boolean {
  const emailLower = (fromEmail || "").toLowerCase();
  if (emailLower.includes("alerts@indeed.com")) return true;
  if (/^jobalerts@/i.test(emailLower) || emailLower.includes("jobalerts@")) return true;
  if (emailLower.includes("noreply@linkedin.com") && /jobs?/i.test(subject)) return true;
  return false;
}

// ── Career Subject Patterns ───────────────────────────────────────────────────

const CAREER_SUBJECT_PATTERNS: [RegExp, string][] = [
  [/offer\s*letter|job\s*offer|pleased\s*to\s*offer|congratulations/i, "offer_received"],
  [/interview\s*(invite|invitation|request)?|schedule\s*interview|technical\s*(round|interview)|hr\s*(round|interview)/i, "interview_invite"],
  [/assessment|coding\s*(test|challenge|round)|hackerrank|technical\s*task/i, "assessment_link"],
  [/portfolio\s*(review|submission|request)/i, "portfolio_request"],
  [/unfortunately|not\s*moving\s*forward|regret\s*to\s*inform|not\s*selected/i, "rejection"],
];

// ── Meeting Subject Patterns ──────────────────────────────────────────────────

const MEETING_SUBJECT_PATTERNS: RegExp[] = [
  /meeting\s*(invite|invitation|request|scheduled|confirmed)/i,
  /calendar\s*invite|you.?re\s*invited\s*to/i,
  /google\s*meet|zoom\.us|teams\.microsoft|webex/i,
  /call\s*(scheduled|invite|invitation)/i,
];

// ── Main classifier ───────────────────────────────────────────────────────────

export function classifyByRules(email: EmailInput): ClassificationResult | null {
  const subject = email.subject ?? "";
  const fromEmail = email.from_email ?? "";
  const fromName = email.from_name ?? "";
  const labels = email.labels ?? [];

  const hasPromotionsLabel = labels.some((l) => l.toUpperCase().includes("CATEGORY_PROMOTIONS"));
  const hasUpdatesLabel = labels.some((l) => l.toUpperCase().includes("CATEGORY_UPDATES"));

  // ── RULE SET 1: OTPs & Verification (HIGH PRIORITY ACTION ITEM) ─────────────
  const isOtp = OTP_SUBJECT_PATTERNS.some((re) => re.test(subject));
  if (isOtp) {
    return {
      category: "otp",
      subcategory: "otp_verification",
      confidence: 0.98,
      tier: "regex",
      has_action_item: true,
    };
  }

  // ── RULE SET 1.5: Course / Cohort Meetings (e.g. UI UX Manager Cohort via IIT Madras Pravartak / Futurense) ──
  // Emails from Futurense / IIT Madras Pravartak / UI UX Manager Cohort are course sessions and class meetings.
  // They must ALWAYS go to "meetings", NEVER to "jobs", "career", or "uiux_role".
  const fromEmailLower = fromEmail.toLowerCase();
  const fromNameLower = fromName.toLowerCase();
  const subjectLower = subject.toLowerCase();

  const isFuturenseCourse =
    fromEmailLower.includes("futurense.com") ||
    fromNameLower.includes("ui ux manager cohort") ||
    fromNameLower.includes("iit madras pravartak") ||
    fromNameLower.includes("futurense") ||
    subjectLower.includes("ui ux manager cohort") ||
    subjectLower.includes("iit madras pravartak");

  if (isFuturenseCourse) {
    return {
      category: "meetings",
      subcategory: "meeting_invite",
      confidence: 0.99,
      tier: "regex",
      has_action_item: true,
    };
  }

  // ── RULE SET 2: Ads / Bank Promotional Checks ───────────────────────────────
  // Special check: Bank emails with promotional subject → category = 'ads', NOT 'finance'
  const isBankDomain = hasDomain(fromEmail, FINANCE_DOMAINS) || hasDomain(fromEmail, FINANCE_TRANSACTION_DOMAINS);
  if (isBankDomain && BANK_PROMO_KEYWORDS.test(subject)) {
    // Check if it's actually an explicit statement/bill/debit rather than a promo
    const isExplicitStatement = /(statement|bill\s*generated|due\s*date|debited|credited)/i.test(subject);
    if (!isExplicitStatement) {
      return {
        category: "ads",
        subcategory: "bank_promo",
        confidence: 0.95,
        tier: "regex",
      };
    }
  }

  // Check sender patterns for ads: noreply@*, marketing@*, promotions@*, etc.
  const isAdsSender = ADS_SENDER_REGEX.test(fromEmail);
  const adsSubMatch = matchSubject(subject, ADS_SUBJECT_PATTERNS);

  if (isAdsSender && (adsSubMatch || hasPromotionsLabel)) {
    return {
      category: "ads",
      subcategory: adsSubMatch ?? "promotional",
      confidence: 0.92,
      tier: "regex",
    };
  }

  // Subject pattern matches strong promo signals or Gmail promotion label
  if (hasPromotionsLabel) {
    return {
      category: "ads",
      subcategory: adsSubMatch ?? "promotions",
      confidence: 0.9,
      tier: "regex",
    };
  }

  if (adsSubMatch) {
    return {
      category: "ads",
      subcategory: adsSubMatch,
      confidence: 0.88,
      tier: "regex",
    };
  }

  // ── RULE SET 3: Social Network Notifications ────────────────────────────────
  const isSocialSender = hasDomain(fromEmail, SOCIAL_DOMAINS);
  const socialSubMatch = matchSubject(subject, SOCIAL_SUBJECT_PATTERNS);

  if (isSocialSender) {
    return {
      category: "social",
      subcategory: socialSubMatch ?? "social_notification",
      confidence: 0.93,
      tier: "regex",
    };
  }

  // For non-social sender domains, ensure subject doesn't match meeting invites before treating as social
  const isMeetingSubject = MEETING_SUBJECT_PATTERNS.some((re) => re.test(subject));
  if (socialSubMatch && !isMeetingSubject) {
    if (socialSubMatch !== "social_invitation" || /connect|network|friend|follow|profile/i.test(subject)) {
      return {
        category: "social",
        subcategory: socialSubMatch,
        confidence: 0.85,
        tier: "regex",
      };
    }
  }

  // ── RULE SET 4: Newsletters & Subscriptions ─────────────────────────────────
  const newsletterSubMatch = matchSubject(subject, NEWSLETTER_SUBJECT_PATTERNS);
  if (newsletterSubMatch || (hasUpdatesLabel && (ADS_SENDER_REGEX.test(fromEmail) || /digest|newsletter|weekly|update/i.test(subject)))) {
    return {
      category: "newsletter",
      subcategory: newsletterSubMatch ?? "newsletter_digest",
      confidence: 0.9,
      tier: "regex",
    };
  }

  // ── RULE SET 4.5: Explicit exclusion for HDFC Sky ──────────────────────────
  // Emails from "HDFC Sky" are stock trading/market updates or newsletters and are
  // in no way related to payments, bank debits/credits, or financial transactions.
  // Other HDFC emails (HDFC Bank, cards, EMIs, SIPs) remain in finance.
  const isHdfcSky =
    fromNameLower.includes("hdfc sky") ||
    fromNameLower.includes("hdfcsky") ||
    fromEmailLower.includes("hdfcsky") ||
    fromEmailLower.includes("hdfc-sky") ||
    subjectLower.includes("hdfc sky") ||
    subjectLower.includes("hdfcsky");

  if (isHdfcSky) {
    const isInvestment = /(demat|stock|equity|portfolio|trading|trade|ipo|mutual\s*fund|dividend|nav|holding|market)/i.test(subject);
    if (isInvestment) {
      return {
        category: "investments",
        subcategory: "demat_alert",
        confidence: 0.95,
        tier: "regex",
      };
    }
    return {
      category: "newsletter",
      subcategory: "market_digest",
      confidence: 0.92,
      tier: "regex",
    };
  }

  // ── RULE SET 5: Finance Transactions & Finance ──────────────────────────────
  // Keep existing 'finance' logic aligned with real financial activity
  const txnSubMatch = matchSubject(subject, FINANCE_TRANSACTION_SUBJECT_PATTERNS);

  if (isBankDomain && txnSubMatch) {
    return {
      category: "finance_transaction",
      subcategory: txnSubMatch,
      confidence: 0.96,
      tier: "regex",
    };
  }

  if (hasDomain(fromEmail, FINANCE_DOMAINS) && txnSubMatch) {
    return {
      category: "finance_transaction",
      subcategory: txnSubMatch,
      confidence: 0.95,
      tier: "regex",
    };
  }

  if (txnSubMatch) {
    return {
      category: "finance_transaction",
      subcategory: txnSubMatch,
      confidence: 0.88,
      tier: "regex",
    };
  }

  // ── RULE SET 6: Investments ────────────────────────────────────────────────
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

  // ── RULE SET 7: Career Events ──────────────────────────────────────────────
  const careerMatch = matchSubject(subject, CAREER_SUBJECT_PATTERNS);
  if (careerMatch) {
    return {
      category: "career",
      subcategory: careerMatch,
      confidence: 0.9,
      tier: "regex",
    };
  }

  // ── RULE SET 8: Jobs (split into application_confirmed and job_alert) ──────
  // 1. Check if user actually applied (application_confirmed)
  const isAppConfirmed = APPLICATION_CONFIRMED_PATTERNS.some((re) => re.test(subject));
  if (isAppConfirmed) {
    return {
      category: "jobs",
      subcategory: "application_confirmed",
      confidence: 0.95,
      tier: "regex",
    };
  }

  // 2. Check if job alert sender or subject pattern matches (job_alert)
  const isJobAlertSenderMatch = isJobAlertSender(fromEmail, subject);
  const isJobAlertSubjectMatch = JOB_ALERT_SUBJECT_PATTERNS.some((re) => re.test(subject));

  if (isJobAlertSenderMatch || isJobAlertSubjectMatch) {
    return {
      category: "jobs",
      subcategory: "job_alert",
      confidence: 0.92,
      tier: "regex",
    };
  }

  // 3. Domain match in JOB_DOMAINS (if not already matched as application, default to job_alert)
  if (hasDomain(fromEmail, JOB_DOMAINS)) {
    return {
      category: "jobs",
      subcategory: "job_alert",
      confidence: 0.88,
      tier: "regex",
    };
  }

  // ── RULE SET 9: Meetings ───────────────────────────────────────────────────
  const hasCalendarLabel = labels.some((l) => l.toUpperCase().includes("CALENDAR"));
  const meetingSubjectMatch = MEETING_SUBJECT_PATTERNS.some((re) => re.test(subject));

  if (meetingSubjectMatch || hasCalendarLabel) {
    return {
      category: "meetings",
      subcategory: "meeting_invite",
      confidence: 0.92,
      tier: "regex",
    };
  }

  // ── RULE SET 10: System / Action ───────────────────────────────────────────
  const systemPatterns: [RegExp, string, boolean][] = [
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
    totalRuleSets: 10,
    categories: [
      "ads",
      "social",
      "newsletter",
      "otp",
      "finance_transaction",
      "finance",
      "investments",
      "jobs",
      "career",
      "meetings",
      "system",
    ],
  };
}
