export interface AIModelConfig {
  tier: "fast" | "balanced" | "deep";
  primaryProvider: "gemini" | "huggingface";
  fallbackKeys: string[];
}

export function getModelConfig(tier: AIModelConfig["tier"]): AIModelConfig {
  const geminiKeys = [
    process.env.GEMINI_KEY_1,
    process.env.GEMINI_KEY_2,
    process.env.GEMINI_KEY_3,
    process.env.GEMINI_KEY_4,
  ].filter(Boolean) as string[];

  const hfKeys = [
    process.env.HF_KEY_1,
    process.env.HF_KEY_2,
    process.env.HF_KEY_3,
    process.env.HF_KEY_4,
  ].filter(Boolean) as string[];

  switch (tier) {
    case "fast":
      return { tier: "fast", primaryProvider: "gemini", fallbackKeys: geminiKeys };
    case "balanced":
      return { tier: "balanced", primaryProvider: "gemini", fallbackKeys: geminiKeys };
    case "deep":
      return { tier: "deep", primaryProvider: "huggingface", fallbackKeys: hfKeys };
  }
}
