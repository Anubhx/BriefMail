"use client";

import React, { useState } from "react";
import { X, Briefcase, Building, Link2, Calendar, FileText, DollarSign, Plus } from "lucide-react";

interface AddApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplicationCreated: () => void;
}

export const AddApplicationModal: React.FC<AddApplicationModalProps> = ({
  isOpen,
  onClose,
  onApplicationCreated,
}) => {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [stage, setStage] = useState<"applied" | "shortlisted" | "interviewing" | "offered" | "rejected">("applied");
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split("T")[0]);
  const [jobBoard, setJobBoard] = useState("LinkedIn");
  const [jobUrl, setJobUrl] = useState("");
  const [salary, setSalary] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !role.trim()) {
      setError("Please fill in both Company and Role.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/career/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company: company.trim(),
          role: role.trim(),
          stage,
          applied_date: appliedDate,
          job_board: jobBoard,
          job_url: jobUrl.trim() || undefined,
          salary_offered: salary ? parseFloat(salary) : undefined,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to create application");
      }

      // Reset form
      setCompany("");
      setRole("");
      setStage("applied");
      setJobUrl("");
      setSalary("");
      setNotes("");
      onApplicationCreated();
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-surface-DEFAULT border border-white/10 rounded-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 bg-surface-elevated/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-subtle text-brand border border-brand/20">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-text-primary font-ui">
                Add Job Application
              </h2>
              <p className="text-xs text-text-muted">
                Track a new opportunity in your pipeline
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs">
              {error}
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5">
              <Building className="h-3.5 w-3.5 text-text-muted" />
              Company Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Google, Stripe, Microsoft"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Role Title */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5">
              <Briefcase className="h-3.5 w-3.5 text-text-muted" />
              Role / Position <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Senior Frontend Engineer"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          {/* Pipeline Stage */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Current Stage
              </label>
              <select
                value={stage}
                onChange={(e) =>
                  setStage(
                    e.target.value as
                      | "applied"
                      | "shortlisted"
                      | "interviewing"
                      | "offered"
                      | "rejected"
                  )
                }
                className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
              >
                <option value="applied">Applied</option>
                <option value="shortlisted">Shortlisted</option>
                <option value="interviewing">Interviewing</option>
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-text-muted" />
                Applied Date
              </label>
              <input
                type="date"
                value={appliedDate}
                onChange={(e) => setAppliedDate(e.target.value)}
                className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
              />
            </div>
          </div>

          {/* Source & Job URL */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1">
                Source / Job Board
              </label>
              <select
                value={jobBoard}
                onChange={(e) => setJobBoard(e.target.value)}
                className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
              >
                <option value="LinkedIn">LinkedIn</option>
                <option value="Naukri">Naukri</option>
                <option value="Indeed">Indeed</option>
                <option value="Wellfound">Wellfound (AngelList)</option>
                <option value="Referral">Referral</option>
                <option value="Direct">Direct Career Site</option>
                <option value="Email">Email Outreach</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-text-muted" />
                Salary (₹ LPA)
              </label>
              <input
                type="number"
                step="0.1"
                placeholder="e.g. 24"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Job Link */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5">
              <Link2 className="h-3.5 w-3.5 text-text-muted" />
              Job Post URL (Optional)
            </label>
            <input
              type="url"
              placeholder="https://www.linkedin.com/jobs/..."
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-xs text-text-primary focus:border-brand focus:outline-none font-mono"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-text-muted" />
              Notes / Recruiter details
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Applied with resume v3, referred by Alex..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg bg-surface-base border border-white/10 p-2.5 text-xs text-text-primary focus:border-brand focus:outline-none"
            />
          </div>

          {/* Buttons */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-text-secondary hover:bg-surface-elevated text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all shadow-md hover:shadow-brand-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? "Adding..." : "Add to Pipeline"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
