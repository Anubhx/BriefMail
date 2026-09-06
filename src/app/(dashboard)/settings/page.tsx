import React from "react";

export default function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <div>
        <h1 className="font-ui text-xl font-bold text-text-primary">Settings</h1>
        <p className="text-sm text-text-muted">Manage your AI model tiers, integrations, and preferences.</p>
      </div>

      <div className="bg-surface rounded-xl border border-border-subtle p-6 flex flex-col gap-4">
        <h2 className="font-ui text-sm font-semibold text-text-primary">AI Tier Configuration</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-lg bg-surface-elevated border border-brand/20">
            <h3 className="font-ui text-sm font-bold text-brand">Fast Tier</h3>
            <p className="text-xs text-text-muted mt-1">Gemini 3.5 Flash Lite (Quick Triage)</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-elevated border border-border-subtle">
            <h3 className="font-ui text-sm font-bold text-text-primary">Balanced Tier</h3>
            <p className="text-xs text-text-muted mt-1">Gemini 1.5 Pro (Deep Analysis)</p>
          </div>
          <div className="p-4 rounded-lg bg-surface-elevated border border-border-subtle">
            <h3 className="font-ui text-sm font-bold text-text-primary">Deep Reasoning</h3>
            <p className="text-xs text-text-muted mt-1">Hugging Face Models (Custom Inference)</p>
          </div>
        </div>
      </div>
    </div>
  );
}
