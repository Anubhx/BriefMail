import { classifyByRules, EmailInput as Tier1EmailInput } from "./tier1-rules";
import { modelRouter } from "./model-router";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EmailInput extends Tier1EmailInput {
  body_preview?: string;
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
  // Tier 1: Regex rules — instant, no API calls
  const t1 = classifyByRules(email);
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

  // Tier 2: HuggingFace zero-shot classification
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

  // HF returned low-confidence (0.5–0.74) or null (throttled) — escalate to Gemini

  // Tier 3: Gemini 2.5 Flash-Lite
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

  // All tiers throttled or failed — defer for retry
  return {
    category: "misc",
    subcategory: "unknown",
    confidence: 0.1,
    tier: "regex",
    has_action_item: false,
    deferred: true,
  };
}
