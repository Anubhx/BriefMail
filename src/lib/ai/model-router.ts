import Redis from "ioredis";
import { EmailInput } from "./tier1-rules";

// ── Types ─────────────────────────────────────────────────────────────────────

export type ModelTier = "gemini" | "huggingface";

export interface KeyStatus {
  key: string;
  alias: string;
  tier: ModelTier;
}

export interface HFResult {
  label: string;
  score: number;
}

export interface GeminiResult {
  category: string;
  subcategory: string;
  confidence: number;
  summary: string;
  extracted_data: Record<string, unknown>;
  has_action: boolean;
  action_type?: string;
  action_due?: string;
}

interface HFApiResponse {
  labels: string[];
  scores: number[];
}

interface GeminiApiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
  }>;
}

// ── System Prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Analyze this email and return ONLY a JSON object. No prose, no markdown, no explanation.

Schema:
{
  "category": "finance|jobs|career|investments|meetings|offers|social|system|misc",
  "subcategory": "emi_payment|bank_alert|upi_neft|credit_card_bill|insurance|bank_statement|loan_offer|sip_confirmation|sip_statement|stock_purchase|portfolio_update|dividend_alert|demat_statement|cas_statement|nav_update|uiux_role|engineering_role|design_role|product_role|recruiter_outreach|job_alert_digest|application_status|referral|offer_letter|interview_invite|assessment_link|rejection|portfolio_request|meeting_invite|meeting_update|otp_verification|workspace_notification|platform_digest|action_required|subscription_alert|demat_alert|promo_discount|subscription_renewal|order_confirmation|linkedin_notification|newsletter|event_invite|otp_verification|unknown",
  "confidence": 0.0,
  "summary": "max 12 words present tense",
  "extracted_data": {
    "amount": null,
    "bank_name": null,
    "payment_mode": null,
    "transaction_date": null,
    "merchant": null,
    "emi_amount": null,
    "lender": null,
    "tenure_remaining": null,
    "fund_name": null,
    "sip_amount": null,
    "nav": null,
    "units": null,
    "company": null,
    "role": null,
    "salary_lpa": null,
    "joining_date": null,
    "portfolio_links": [],
    "meeting_time": null,
    "meeting_link": null,
    "platform": null,
    "has_action": false,
    "action_type": null,
    "action_due": null
  }
}

Rules: return valid JSON only. Numbers without currency symbols. null for missing fields. confidence below 0.6 means uncertain but still return best guess.
CRITICAL: Emails from "HDFC SKY" (or HDFC Securities trading platform) are stock trading/demat/market/newsletter emails. NEVER classify "HDFC Sky" as finance or payment transactions. Classify as "investments" (e.g. demat_statement, stock_purchase, portfolio_update) or "newsletter". Other HDFC entities (HDFC Bank, HDFC Cards, HDFC Home Loans) CAN be finance.
CRITICAL: Emails from "tech@futurense.com", "Futurense", "IIT Madras Pravartak", or "UI UX Manager Cohort" are COURSE MEETING & CLASS LECTURE emails. They must ALWAYS be classified as category: "meetings" (subcategory: "meeting_invite" or "meeting_update"). They are NOT job listings or career emails. NEVER classify them as "jobs", "career", or "uiux_role".

Email data:
`;

// ── HF label → internal category mapping ─────────────────────────────────────

const HF_LABEL_MAP: Record<string, string> = {
  finance: "finance",
  "job opportunity": "jobs",
  investment: "investments",
  career: "career",
  meeting: "meetings",
  "system notification": "system",
  "promotional offer": "offers",
  social: "social",
};

// ── Class ─────────────────────────────────────────────────────────────────────

class ModelRouter {
  private geminiKeys: Array<{ key: string; alias: string }>;
  private hfKeys: Array<{ key: string; alias: string }>;
  private redis: Redis | null = null;
  private inMemoryGeminiIdx = 0;
  private inMemoryHfIdx = 0;

  constructor() {
    // Load Gemini keys — skip if env var is empty
    this.geminiKeys = [1, 2, 3, 4]
      .map((n) => ({
        key: process.env[`GEMINI_KEY_${n}`] ?? "",
        alias: `gemini_${n}`,
      }))
      .filter((k) => k.key.length > 0);

    // Load HuggingFace keys — skip if env var is empty
    this.hfKeys = [1, 2, 3, 4]
      .map((n) => ({
        key: process.env[`HF_KEY_${n}`] ?? "",
        alias: `hf_${n}`,
      }))
      .filter((k) => k.key.length > 0);

    if (process.env.REDIS_URL) {
      try {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          lazyConnect: true,
          connectTimeout: 2000,
          enableOfflineQueue: false,
        });
        this.redis.on("error", (err) => {
          console.warn("[ModelRouter] Redis connection warning (falling back to in-memory/direct key usage):", err?.message || err);
        });
      } catch (err) {
        console.warn("[ModelRouter] Redis init skipped:", err);
        this.redis = null;
      }
    } else {
      this.redis = null;
    }
  }

  // ── RPM tracking ────────────────────────────────────────────────────────────

  private async getRPMUsed(alias: string): Promise<number> {
    try {
      if (!this.redis) return 0;
      const val = await this.redis.get(`adv_mail:rpm:${alias}`);
      return parseInt(val ?? "0", 10) || 0;
    } catch {
      return 0;
    }
  }

  private async incrementRPM(alias: string): Promise<void> {
    try {
      if (!this.redis) return;
      const pipeline = this.redis.multi();
      pipeline.incr(`adv_mail:rpm:${alias}`);
      pipeline.expire(`adv_mail:rpm:${alias}`, 60);
      await pipeline.exec();
    } catch {
      // Redis tracking failure is non-fatal
    }
  }

  // ── Round-robin key selection ───────────────────────────────────────────────

  async getNextGeminiKey(): Promise<KeyStatus | null> {
    const envKeys = [
      process.env.GEMINI_KEY_1,
      process.env.GEMINI_KEY_2,
      process.env.GEMINI_KEY_3,
      process.env.GEMINI_KEY_4,
    ].filter(Boolean) as string[];

    const activeKeys =
      this.geminiKeys.length > 0
        ? this.geminiKeys
        : envKeys.map((k, i) => ({ key: k, alias: `gemini_${i + 1}` }));

    if (activeKeys.length === 0) return null;

    try {
      if (!this.redis) throw new Error("no redis");
      const rrKey = "adv_mail:gemini_rr_idx";
      const startIdx = parseInt((await this.redis.get(rrKey)) ?? "0", 10) || 0;

      for (let offset = 0; offset < activeKeys.length; offset++) {
        const idx = (startIdx + offset) % activeKeys.length;
        const candidate = activeKeys[idx];
        const rpm = await this.getRPMUsed(candidate.alias);

        // Free tier has 15 RPM max -> keep threshold at 14 to avoid 429
        if (rpm < 14) {
          try {
            await this.redis.set(rrKey, ((idx + 1) % activeKeys.length).toString());
          } catch {
            // Ignore Redis write error
          }
          return { key: candidate.key, alias: candidate.alias, tier: "gemini" };
        }
      }

      return null; // All throttled
    } catch {
      // Fallback: smooth in-memory round-robin across all active keys
      const idx = this.inMemoryGeminiIdx % activeKeys.length;
      this.inMemoryGeminiIdx = (this.inMemoryGeminiIdx + 1) % activeKeys.length;
      return { key: activeKeys[idx].key, alias: activeKeys[idx].alias, tier: "gemini" };
    }
  }

  async getNextHFKey(): Promise<KeyStatus | null> {
    const envKeys = [
      process.env.HF_KEY_1,
      process.env.HF_KEY_2,
      process.env.HF_KEY_3,
      process.env.HF_KEY_4,
    ].filter(Boolean) as string[];

    const activeKeys =
      this.hfKeys.length > 0
        ? this.hfKeys
        : envKeys.map((k, i) => ({ key: k, alias: `hf_${i + 1}` }));

    if (activeKeys.length === 0) return null;

    try {
      if (!this.redis) throw new Error("no redis");
      const rrKey = "adv_mail:hf_rr_idx";
      const startIdx = parseInt((await this.redis.get(rrKey)) ?? "0", 10) || 0;

      for (let offset = 0; offset < activeKeys.length; offset++) {
        const idx = (startIdx + offset) % activeKeys.length;
        const candidate = activeKeys[idx];
        const rpm = await this.getRPMUsed(candidate.alias);

        if (rpm < 9) {
          try {
            await this.redis.set(rrKey, ((idx + 1) % activeKeys.length).toString());
          } catch {
            // Ignore Redis write error
          }
          return { key: candidate.key, alias: candidate.alias, tier: "huggingface" };
        }
      }

      return null; // All throttled
    } catch {
      const idx = this.inMemoryHfIdx % activeKeys.length;
      this.inMemoryHfIdx = (this.inMemoryHfIdx + 1) % activeKeys.length;
      return { key: activeKeys[idx].key, alias: activeKeys[idx].alias, tier: "huggingface" };
    }
  }

  // ── AI Rate Budget tracking ──────────────────────────────────────────────────

  async checkAIRateBudget(key = "adv_mail:ai_rate_budget"): Promise<boolean> {
    try {
      if (!this.redis) return true;
      const val = await this.redis.get(key);
      if (val === null) return true;
      const budgetRemaining = parseInt(val, 10);
      return isNaN(budgetRemaining) || budgetRemaining > 0;
    } catch {
      return true;
    }
  }

  async recordAIRateBudgetUsage(key = "adv_mail:ai_rate_budget", amount = 1): Promise<void> {
    try {
      if (!this.redis) return;
      await this.redis.decrby(key, amount);
    } catch {
      // Redis unavailable - skip budget tracking
    }
  }

  // ── HuggingFace inference ───────────────────────────────────────────────────

  async classifyWithHF(subject: string, snippet: string): Promise<HFResult | null> {
    try {
      const keyStatus = await this.getNextHFKey();
      if (!keyStatus) return null;

      const res = await fetch(
        "https://api-inference.huggingface.co/models/facebook/bart-large-mnli",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${keyStatus.key}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            inputs: `${subject} ${snippet || ""}`.trim(),
            parameters: {
              candidate_labels: [
                "finance",
                "job opportunity",
                "investment",
                "career",
                "meeting",
                "system notification",
                "promotional offer",
                "social",
              ],
              multi_label: false,
            },
          }),
        }
      );

      if (res.status === 503 || res.status === 429) return null;
      if (!res.ok) return null;

      const data = (await res.json()) as HFApiResponse;
      await this.incrementRPM(keyStatus.alias);

      if (!data.labels?.length || !data.scores?.length) return null;

      const rawLabel = data.labels[0];
      const mappedLabel = HF_LABEL_MAP[rawLabel] ?? "misc";

      return { label: mappedLabel, score: data.scores[0] };
    } catch {
      return null;
    }
  }

  // ── Gemini inference ────────────────────────────────────────────────────────

  async classifyWithGemini(
    email: Pick<EmailInput, "from_email" | "subject" | "snippet"> & {
      from_name?: string;
      body_preview?: string;
    }
  ): Promise<GeminiResult | null> {
    const maxAttempts = Math.min(Math.max(this.geminiKeys.length, 1), 4);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const keyStatus = await this.getNextGeminiKey();
        if (!keyStatus) return null;

        // Primary model: gemini-3.5-flash-lite, fallback: gemini-3.6-flash
        const models = ["gemini-3.5-flash-lite", "gemini-3.6-flash"];
        let res: Response | null = null;

        for (const model of models) {
          try {
            res = await fetch(
              `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${keyStatus.key}`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  contents: [
                    {
                      parts: [
                        {
                          text: SYSTEM_PROMPT + JSON.stringify(email),
                        },
                      ],
                    },
                  ],
                  generationConfig: {
                    temperature: 0.1,
                    maxOutputTokens: 500,
                    responseMimeType: "application/json",
                  },
                }),
              }
            );

            if (res.ok) break;

            // If 429 rate limit hit, break model loop and rotate to next key
            if (res.status === 429) {
              console.warn(`[ModelRouter] Gemini key ${keyStatus.alias} hit 429 rate limit. Rotating key...`);
              break;
            }
          } catch (fetchErr) {
            console.warn(`[ModelRouter] Fetch error on ${model}:`, fetchErr);
          }
        }

        if (res && res.ok) {
          const data = (await res.json()) as GeminiApiResponse;
          await this.incrementRPM(keyStatus.alias);

          const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
          if (!text) return null;

          const parsed = JSON.parse(text) as GeminiResult;

          // Explicit safeguard: HDFC Sky is trading/investments/newsletter, NOT finance/payment transactions
          const fromNameLower = (email.from_name || "").toLowerCase();
          const fromEmailLower = (email.from_email || "").toLowerCase();
          const subjectLower = (email.subject || "").toLowerCase();
          const isSky =
            fromNameLower.includes("hdfc sky") ||
            fromNameLower.includes("hdfcsky") ||
            fromEmailLower.includes("hdfcsky") ||
            fromEmailLower.includes("hdfc-sky") ||
            subjectLower.includes("hdfc sky") ||
            subjectLower.includes("hdfcsky");

          if (isSky && (parsed.category === "finance" || parsed.category === "finance_transaction")) {
            parsed.category = "investments";
            parsed.subcategory = "demat_alert";
          }

          // Explicit safeguard: Futurense / IIT Madras Pravartak / UI UX Manager Cohort must ALWAYS be meetings
          const isCourseMeeting =
            fromEmailLower.includes("futurense.com") ||
            fromNameLower.includes("ui ux manager cohort") ||
            fromNameLower.includes("iit madras pravartak") ||
            fromNameLower.includes("futurense") ||
            subjectLower.includes("ui ux manager cohort") ||
            subjectLower.includes("iit madras pravartak");

          if (isCourseMeeting) {
            parsed.category = "meetings";
            parsed.subcategory = "meeting_invite";
          }

          return parsed;
        }
      } catch (err) {
        console.warn("[ModelRouter] Gemini attempt failed:", err);
      }
    }

    return null;
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const modelRouter = new ModelRouter();
