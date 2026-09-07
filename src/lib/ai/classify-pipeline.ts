import { classifyByRules, EmailInput as Tier1EmailInput } from "./tier1-rules";
import { modelRouter } from "./model-router";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmailInput extends Tier1EmailInput {
  body_preview?: string;
  body_text?: string;
  body_html?: string;
  received_at?: Date;
}

export interface ClassificationOutput {
  category: string;
  subcategory: string;
  confidence: number;
  tier: "regex" | "huggingface" | "gemini" | "manual";
  ai_summary?: string;
  extracted_data?: Record<string, unknown>;
  has_action_item: boolean;
  action_items?: Array<{ type: string; description: string; due_date?: string }>;
  deferred?: boolean;
}

// ── Main pipeline ─────────────────────────────────────────────────────────────

export async function classifyEmail(email: EmailInput): Promise<ClassificationOutput> {
  // Tier 1: Regex rules - instant, no API calls
  let t1: ReturnType<typeof classifyByRules> = null;
  try {
    t1 = classifyByRules(email);
    if (t1) {
      return {
        category: t1.category,
        subcategory: t1.subcategory,
        confidence: t1.confidence,
        tier: "regex",
        extracted_data: t1.extracted_data,
        has_action_item: t1.has_action_item ?? false,
      };
    }
  } catch (t1Err) {
    console.warn("[classify-pipeline] Tier 1 rule evaluation error:", t1Err);
  }

  // Tier 2: HuggingFace zero-shot classification
  // If Tier 2 fails for ANY reason, catch the error and fall through to Tier 3 (Gemini)
  try {
    const hf = await modelRouter.classifyWithHF(
      email.subject,
      email.snippet ?? ""
    );

    if (hf && hf.score >= 0.75) {
      return {
        category: hf.label,
        subcategory: "unknown",
        confidence: hf.score,
        tier: "huggingface",
        has_action_item: false,
      };
    }
  } catch (hfErr) {
    console.warn("[classify-pipeline] Tier 2 (HuggingFace) failed, falling through to Tier 3:", hfErr);
  }

  // Tier 3: Gemini models (gemini-3.5-flash-lite -> gemini-3.5-flash -> gemini-2.5-flash)
  try {
    const gem = await modelRouter.classifyWithGemini({
      from_email: email.from_email,
      subject: email.subject,
      snippet: email.snippet,
      body_preview: email.body_preview,
    });

    if (gem) {
      const hasAction = (gem.extracted_data?.has_action as boolean) ?? false;
      const actionType = gem.extracted_data?.action_type as string | undefined;
      const actionDue = gem.extracted_data?.action_due as string | undefined;

      return {
        category: gem.category,
        subcategory: gem.subcategory,
        confidence: gem.confidence,
        tier: "gemini",
        ai_summary: gem.summary,
        extracted_data: gem.extracted_data,
        has_action_item: hasAction,
        action_items: actionType
          ? [
            {
              type: actionType,
              description: gem.summary,
              due_date: actionDue,
            },
          ]
          : [],
      };
    }
  } catch (gemErr) {
    console.warn("[classify-pipeline] Tier 3 (Gemini) failed:", gemErr);
  }

  // If Tier 3 also fails, fall back to Tier 1 result or default category 'system'
  if (t1) {
    return {
      category: t1.category,
      subcategory: t1.subcategory,
      confidence: t1.confidence,
      tier: "regex",
      extracted_data: t1.extracted_data,
      has_action_item: t1.has_action_item ?? false,
    };
  }

  return {
    category: "system",
    subcategory: "unknown",
    confidence: 0.5,
    tier: "regex",
    has_action_item: false,
  };
}
