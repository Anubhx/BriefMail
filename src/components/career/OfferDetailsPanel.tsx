"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Trophy,
  Calendar,
  DollarSign,
  MapPin,
  Briefcase,
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  ExternalLink,
  Sparkles,
} from "lucide-react";
import { differenceInDays, parseISO, isValid } from "date-fns";

export interface OfferDetails {
  id?: string;
  ctc_lpa?: number | null;
  fixed_lpa?: number | null;
  variable_lpa?: number | null;
  joining_date?: string | null;
  offer_deadline?: string | null;
  location?: string | null;
  work_mode?: "remote" | "hybrid" | "onsite" | null;
  raw_text?: string | null;
  status?: "pending" | "accepted" | "declined" | "expired";
}

export interface ApplicationWithOffer {
  id: string;
  company_name: string;
  role_title?: string;
  current_stage: string;
  applied_date?: string;
  salary_offered?: number | null;
  offer_letters?: OfferDetails[] | OfferDetails;
  offer_details?: {
    salary_lpa?: number | null;
    fixed_lpa?: number | null;
    variable_lpa?: number | null;
    joining_date?: string | null;
    location?: string | null;
  };
}

interface OfferPanelProps {
  application: ApplicationWithOffer | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: (updatedOffer: OfferDetails) => void;
}

export const OfferDetailsPanel: React.FC<OfferPanelProps> = ({
  application,
  isOpen,
  onClose,
  onSaveSuccess,
}) => {
  const [ctc, setCtc] = useState<string>("");
  const [fixed, setFixed] = useState<string>("");
  const [variable, setVariable] = useState<string>("");
  const [joiningDate, setJoiningDate] = useState<string>("");
  const [deadline, setDeadline] = useState<string>("");
  const [location, setLocation] = useState<string>("");
  const [workMode, setWorkMode] = useState<"remote" | "hybrid" | "onsite">("hybrid");
  const [offerUrl, setOfferUrl] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [status, setStatus] = useState<"pending" | "accepted" | "declined" | "expired">("pending");
  const [saving, setSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  useEffect(() => {
    if (application) {
      const rawOffer = Array.isArray(application.offer_letters)
        ? application.offer_letters[0]
        : application.offer_letters;

      const ctcVal = rawOffer?.ctc_lpa ?? application.offer_details?.salary_lpa ?? application.salary_offered;
      setCtc(ctcVal !== null && ctcVal !== undefined ? String(ctcVal) : "");

      const fixVal = rawOffer?.fixed_lpa ?? application.offer_details?.fixed_lpa;
      setFixed(fixVal !== null && fixVal !== undefined ? String(fixVal) : "");

      const varVal = rawOffer?.variable_lpa ?? application.offer_details?.variable_lpa;
      setVariable(varVal !== null && varVal !== undefined ? String(varVal) : "");

      const joinVal = rawOffer?.joining_date ?? application.offer_details?.joining_date;
      setJoiningDate(joinVal ? joinVal.split("T")[0] : "");

      const deadVal = rawOffer?.offer_deadline;
      setDeadline(deadVal ? deadVal.split("T")[0] : "");

      setLocation(rawOffer?.location ?? application.offer_details?.location ?? "");
      setWorkMode(rawOffer?.work_mode ?? "hybrid");
      setStatus(rawOffer?.status ?? "pending");

      // Extract URL if saved in raw_text
      const raw = rawOffer?.raw_text || "";
      if (raw.includes("URL: ")) {
        const parts = raw.split("URL: ");
        setOfferUrl(parts[1] || "");
        setNotes(parts[0].trim());
      } else {
        setOfferUrl("");
        setNotes(raw);
      }
    }
  }, [application]);

  if (!isOpen || !application) return null;

  // Countdown calculation
  const computeCountdown = () => {
    if (!joiningDate) return null;
    try {
      const targetDate = parseISO(joiningDate);
      if (!isValid(targetDate)) return null;
      const days = differenceInDays(targetDate, new Date());
      if (days > 0) {
        return { text: `Joining in ${days} days`, urgent: days <= 7, type: "future" };
      } else if (days === 0) {
        return { text: "Joining Today! 🎉", urgent: true, type: "today" };
      } else {
        return { text: `Joined ${Math.abs(days)} days ago`, urgent: false, type: "past" };
      }
    } catch {
      return null;
    }
  };

  const countdown = computeCountdown();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccessMsg(false);

    try {
      const res = await fetch(`/api/career/applications/${application.id}/offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ctc_lpa: ctc ? parseFloat(ctc) : null,
          fixed_lpa: fixed ? parseFloat(fixed) : null,
          variable_lpa: variable ? parseFloat(variable) : null,
          joining_date: joiningDate || null,
          offer_deadline: deadline || null,
          location: location || null,
          work_mode: workMode,
          offer_letter_url: offerUrl || null,
          raw_text: notes || null,
          status,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSaveSuccessMsg(true);
        if (data.offer) {
          onSaveSuccess(data.offer);
        }
        setTimeout(() => setSaveSuccessMsg(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save offer:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div
        className="w-full max-w-lg bg-surface-DEFAULT border-l border-white/10 h-full overflow-y-auto flex flex-col shadow-2xl animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-5 bg-surface-DEFAULT/95 backdrop-blur-md border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-text-primary font-ui flex items-center gap-2">
                Offer Letter Details
              </h2>
              <p className="text-xs text-text-muted">
                {application.company_name} — {application.role_title || "Position"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-text-muted hover:bg-surface-elevated hover:text-text-primary transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-6 flex-1">
          {/* Countdown & Status Banner */}
          <div className="rounded-xl bg-gradient-to-r from-emerald-950/40 via-surface-elevated to-surface-DEFAULT p-4 border border-emerald-500/25 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                <Sparkles className="h-4 w-4" />
                <span>Offer Status</span>
              </div>
              <div className="flex gap-1.5">
                {(["pending", "accepted", "declined"] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatus(st)}
                    className={`text-xs px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                      status === st
                        ? st === "accepted"
                          ? "bg-emerald-500 text-black font-semibold shadow-sm"
                          : st === "declined"
                          ? "bg-rose-500 text-white font-semibold"
                          : "bg-amber-500 text-black font-semibold"
                        : "bg-surface-base text-text-muted hover:text-text-primary"
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {countdown && (
              <div className="flex items-center gap-2 pt-1">
                <Clock className="h-4 w-4 text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-300 font-ui">
                  {countdown.text}
                </span>
              </div>
            )}
          </div>

          {/* CTC Breakdown Section */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-brand" />
              Compensation (LPA - Lakhs / Annum)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Total CTC (₹ LPA)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 24.5"
                  value={ctc}
                  onChange={(e) => setCtc(e.target.value)}
                  className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Fixed Base (₹ LPA)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 20.0"
                  value={fixed}
                  onChange={(e) => setFixed(e.target.value)}
                  className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Variable / Bonus (₹ LPA)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 4.5"
                  value={variable}
                  onChange={(e) => setVariable(e.target.value)}
                  className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand font-mono"
                />
              </div>
            </div>
          </div>

          {/* Dates & Schedule */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-sky-400" />
              Important Dates
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Joining Date
                </label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Offer Acceptance Deadline
                </label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>
            </div>
          </div>

          {/* Location & Work Mode */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-purple-400" />
              Location & Work Setup
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Location / City
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore / Remote"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-text-secondary mb-1">
                  Work Mode
                </label>
                <select
                  value={workMode}
                  onChange={(e) => setWorkMode(e.target.value as "remote" | "hybrid" | "onsite")}
                  className="w-full rounded-lg bg-surface-base border border-white/10 px-3 py-2 text-sm text-text-primary focus:border-brand focus:outline-none"
                >
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="onsite">On-site</option>
                </select>
              </div>
            </div>
          </div>

          {/* Offer Letter Document URL / Storage */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted flex items-center gap-2">
              <FileText className="h-3.5 w-3.5 text-amber-400" />
              Offer Letter Document
            </h3>

            <div className="rounded-xl border border-dashed border-white/15 bg-surface-base/50 p-4 space-y-3">
              <label className="block text-xs text-text-secondary">
                Document URL / Google Drive / Dropbox Link
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  placeholder="https://drive.google.com/..."
                  value={offerUrl}
                  onChange={(e) => setOfferUrl(e.target.value)}
                  className="flex-1 rounded-lg bg-surface-DEFAULT border border-white/10 px-3 py-2 text-xs text-text-primary focus:border-brand focus:outline-none font-mono"
                />
                {offerUrl && (
                  <a
                    href={offerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-3 py-2 rounded-lg bg-surface-elevated text-xs text-sky-400 hover:text-sky-300 border border-white/10"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                )}
              </div>
              <p className="text-[11px] text-text-disabled flex items-center gap-1">
                <UploadCloud className="h-3 w-3" />
                Link your signed offer letter or cloud copy for quick reference.
              </p>
            </div>
          </div>

          {/* Additional Notes */}
          <div className="space-y-2">
            <label className="block text-xs text-text-secondary">
              Notes & Negotiations
            </label>
            <textarea
              rows={3}
              placeholder="e.g. Health insurance details, signing bonus terms, stock options..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full rounded-lg bg-surface-base border border-white/10 p-3 text-xs text-text-primary focus:border-brand focus:outline-none"
            />
          </div>

          {saveSuccessMsg && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Offer details updated successfully!
            </div>
          )}

          {/* Footer Submit */}
          <div className="sticky bottom-0 pt-4 bg-surface-DEFAULT/95 backdrop-blur-sm border-t border-white/10 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-white/10 text-text-secondary hover:bg-surface-elevated text-xs font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all shadow-md hover:shadow-brand-glow flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Offer Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
