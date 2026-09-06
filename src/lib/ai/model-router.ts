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
  private redis: Redis;

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

    this.redis = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
      maxRetriesPerRequest: 2,
      lazyConnect: true,
    });
  }

  // ── RPM tracking ────────────────────────────────────────────────────────────

  private async getRPMUsed(alias: string): Promise<number> {
    const val = await this.redis.get(`adv_mail:rpm:${alias}`);
    return parseInt(val ?? "0", 10) || 0;
  }

  private async incrementRPM(alias: string): Promise<void> {
    const pipeline = this.redis.multi();
    pipeline.incr(`adv_mail:rpm:${alias}`);
    pipeline.expire(`adv_mail:rpm:${alias}`, 60);
    await pipeline.exec();
  }

  // ── Round-robin key selection ───────────────────────────────────────────────

  async getNextGeminiKey(): Promise<KeyStatus | null> {
    if (this.geminiKeys.length === 0) return null;

    const rrKey = "adv_mail:gemini_rr_idx";
    const startIdx = parseInt((await this.redis.get(rrKey)) ?? "0", 10) || 0;

    for (let offset = 0; offset < this.geminiKeys.length; offset++) {
      const idx = (startIdx + offset) % this.geminiKeys.length;
      const candidate = this.geminiKeys[idx];
      const rpm = await this.getRPMUsed(candidate.alias);

      if (rpm < 14) {
        await this.redis.set(rrKey, ((idx + 1) % this.geminiKeys.length).toString());
        return { key: candidate.key, alias: candidate.alias, tier: "gemini" };
      }
    }

    return null; // All throttled
  }

  async getNextHFKey(): Promise<KeyStatus | null> {
    if (this.hfKeys.length === 0) return null;

    const rrKey = "adv_mail:hf_rr_idx";
    const startIdx = parseInt((await this.redis.get(rrKey)) ?? "0", 10) || 0;

    for (let offset = 0; offset < this.hfKeys.length; offset++) {
      const idx = (startIdx + offset) % this.hfKeys.length;
      const candidate = this.hfKeys[idx];
      const rpm = await this.getRPMUsed(candidate.alias);

      if (rpm < 9) {
        await this.redis.set(rrKey, ((idx + 1) % this.hfKeys.length).toString());
        return { key: candidate.key, alias: candidate.alias, tier: "huggingface" };
      }
    }

    return null; // All throttled
  }

  // ── HuggingFace inference ───────────────────────────────────────────────────

  async classifyWithHF(subject: string, snippet: string): Promise<HFResult | null> {
    const keyStatus = await this.getNextHFKey();
    if (!keyStatus) return null;

    try {
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
      body_preview?: string;
    }
  ): Promise<GeminiResult | null> {
    const keyStatus = await this.getNextGeminiKey();
    if (!keyStatus) return null;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${keyStatus.key}`,
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

      if (!res.ok) return null;

      const data = (await res.json()) as GeminiApiResponse;
      await this.incrementRPM(keyStatus.alias);

      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) return null;

      return JSON.parse(text) as GeminiResult;
    } catch {
      return null;
    }
  }
}

// ── Singleton export ──────────────────────────────────────────────────────────

export const modelRouter = new ModelRouter();
