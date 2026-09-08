"use client";

import React from "react";
import {
  Video,
  Calendar,
  Clock,
  ExternalLink,
  Users,
  CalendarPlus,
  Sparkles,
} from "lucide-react";
import {
  format,
  differenceInMinutes,
  differenceInHours,
  parseISO,
  isValid,
} from "date-fns";

export interface MeetingAttendee {
  name?: string;
  email: string;
  status?: string;
}

export interface MeetingData {
  id: string;
  title: string;
  organizer_name?: string | null;
  organizer_email?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  meeting_link?: string | null;
  platform?: "meet" | "zoom" | "teams" | "other" | null;
  agenda?: string | null;
  status?: "upcoming" | "cancelled" | "completed" | null;
  attendees?: MeetingAttendee[];
}

interface MeetingCardProps {
  meeting: MeetingData;
  isPast?: boolean;
}

export const MeetingCard: React.FC<MeetingCardProps> = ({ meeting, isPast = false }) => {
  const startDate = meeting.start_time ? parseISO(meeting.start_time) : null;
  const endDate = meeting.end_time ? parseISO(meeting.end_time) : null;
  const isStartValid = startDate && isValid(startDate);

  // Platform styling
  const platform = (meeting.platform || "other").toLowerCase();
  const getPlatformConfig = () => {
    switch (platform) {
      case "meet":
        return {
          name: "Google Meet",
          badgeBg: "bg-emerald-50",
          badgeText: "text-emerald-800",
          border: "border-emerald-200/80",
          dotColor: "bg-emerald-600",
        };
      case "zoom":
        return {
          name: "Zoom",
          badgeBg: "bg-sky-50",
          badgeText: "text-sky-800",
          border: "border-sky-200/80",
          dotColor: "bg-sky-600",
        };
      case "teams":
        return {
          name: "Microsoft Teams",
          badgeBg: "bg-purple-50",
          badgeText: "text-purple-800",
          border: "border-purple-200/80",
          dotColor: "bg-purple-600",
        };
      default:
        return {
          name: "Online Meeting",
          badgeBg: "bg-surface-subtle",
          badgeText: "text-text-secondary",
          border: "border-border-default",
          dotColor: "bg-text-muted",
        };
    }
  };

  const platformConfig = getPlatformConfig();

  // Countdown & Urgency calculation
  let countdownText = "";
  let isHappeningNow = false;
  let isSoon = false;

  if (isStartValid && !isPast) {
    const now = new Date();
    const diffMinutes = differenceInMinutes(startDate, now);
    const diffHours = differenceInHours(startDate, now);

    if (diffMinutes <= 0 && diffMinutes >= -60) {
      isHappeningNow = true;
      countdownText = "Happening Now";
    } else if (diffMinutes > 0 && diffMinutes <= 30) {
      isSoon = true;
      countdownText = `In ${diffMinutes}m`;
    } else if (diffHours < 24 && diffMinutes > 0) {
      const remainingMinutes = diffMinutes % 60;
      countdownText =
        remainingMinutes > 0
          ? `In ${diffHours}h ${remainingMinutes}m`
          : `In ${diffHours}h`;
    } else if (diffMinutes > 0) {
      countdownText = format(startDate, "MMM d, h:mm a");
    }
  }

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!isStartValid) return "#";
    const startIso = startDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    const endIso =
      endDate && isValid(endDate)
        ? endDate.toISOString().replace(/-|:|\.\d\d\d/g, "")
        : new Date(startDate.getTime() + 45 * 60 * 1000)
            .toISOString()
            .replace(/-|:|\.\d\d\d/g, "");

    const params = new URLSearchParams({
      action: "TEMPLATE",
      text: meeting.title || "Meeting",
      dates: `${startIso}/${endIso}`,
      details: `${meeting.agenda || ""}\n\nJoin Link: ${meeting.meeting_link || "N/A"}`,
      location: meeting.meeting_link || "Online",
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  const attendeesList = Array.isArray(meeting.attendees) ? meeting.attendees : [];
  const displayAttendees = attendeesList.slice(0, 3);
  const extraCount = Math.max(0, attendeesList.length - 3);

  return (
    <div
      className={`group relative rounded-2xl bg-surface-elevated p-5 sm:p-6 border transition-all duration-200 shadow-xs hover:border-border-hover ${
        isHappeningNow
          ? "border-emerald-300 ring-1 ring-emerald-300/50 bg-emerald-50/[0.04]"
          : isSoon
          ? "border-brand/40 ring-1 ring-brand/20"
          : "border-border-default"
      }`}
    >
      {/* Top Bar: Platform Badge & Live Countdown Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${platformConfig.badgeBg} ${platformConfig.badgeText} border ${platformConfig.border}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${platformConfig.dotColor} ${
                isHappeningNow ? "animate-ping" : ""
              }`}
            />
            {platformConfig.name}
          </span>

          {isHappeningNow && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-700 text-white shadow-xs">
              <Sparkles className="h-3 w-3" />
              Live Now
            </span>
          )}
        </div>

        {/* Countdown / Timestamp */}
        {countdownText && (
          <div
            className={`flex items-center gap-1.5 text-xs font-mono font-medium px-2.5 py-1 rounded-lg ${
              isHappeningNow || isSoon
                ? "bg-amber-50 text-amber-800 border border-amber-200"
                : "text-text-muted bg-surface-subtle border border-border-default"
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{countdownText}</span>
          </div>
        )}
      </div>

      {/* Main Details */}
      <div className="space-y-1.5">
        <h3 className="text-base sm:text-lg font-serif font-bold text-text-primary leading-snug group-hover:text-brand transition-colors">
          {meeting.title}
        </h3>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-text-secondary">
          {isStartValid && (
            <div className="flex items-center gap-1.5 text-text-muted font-mono">
              <Calendar className="h-3.5 w-3.5 text-text-muted" />
              <span>{format(startDate, "EEEE, MMMM d, yyyy")}</span>
            </div>
          )}

          {isStartValid && (
            <div className="flex items-center gap-1.5 text-text-muted font-mono">
              <Clock className="h-3.5 w-3.5 text-text-muted" />
              <span>
                {format(startDate, "h:mm a")}
                {endDate && isValid(endDate) ? ` – ${format(endDate, "h:mm a")}` : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Organizer & Attendees Section */}
      <div className="mt-4 pt-4 border-t border-border-subtle flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Organizer */}
          {meeting.organizer_name || meeting.organizer_email ? (
            <div className="text-xs">
              <span className="text-text-muted block text-[10px] uppercase font-mono">
                Host
              </span>
              <span className="text-text-primary font-medium">
                {meeting.organizer_name || meeting.organizer_email}
              </span>
            </div>
          ) : null}

          {/* Attendees Avatars */}
          {attendeesList.length > 0 && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-border-default">
              <div className="flex -space-x-2 overflow-hidden">
                {displayAttendees.map((att, idx) => (
                  <div
                    key={idx}
                    title={att.name || att.email}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-surface-subtle text-[10px] font-bold text-text-primary ring-2 ring-surface-elevated border border-border-default uppercase"
                  >
                    {(att.name || att.email).charAt(0)}
                  </div>
                ))}
              </div>
              {extraCount > 0 && (
                <span className="text-[11px] font-mono text-text-muted font-medium ml-1">
                  +{extraCount} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons: Join + Add to Calendar */}
        <div className="flex items-center gap-2">
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-elevated hover:bg-surface-hover border border-border-default text-xs font-medium text-text-secondary hover:text-text-primary transition-colors shadow-xs"
            title="Add to Google Calendar"
          >
            <CalendarPlus className="h-3.5 w-3.5 text-text-muted" />
            <span className="hidden sm:inline">Add to Calendar</span>
          </a>

          {meeting.meeting_link ? (
            <a
              href={meeting.meeting_link}
              target="_blank"
              rel="noopener noreferrer"
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shadow-xs ${
                isHappeningNow || isSoon
                  ? "bg-emerald-700 hover:bg-emerald-800 text-white"
                  : "bg-text-primary hover:bg-text-primary/90 text-white"
              }`}
            >
              <Video className="h-4 w-4" />
              <span>Join Meeting</span>
              <ExternalLink className="h-3 w-3 opacity-70" />
            </a>
          ) : (
            <button
              disabled
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-subtle border border-border-default text-xs text-text-muted cursor-not-allowed"
            >
              <Video className="h-3.5 w-3.5" />
              <span>No link</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
