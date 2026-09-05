import { create } from "zustand";
import { EmailItem } from "@/types";

interface EmailState {
  emails: EmailItem[];
  selectedEmailId: string | null;
  activeCategory: "inbox" | "finance" | "career" | "meetings";
  setSelectedEmailId: (id: string | null) => void;
  setActiveCategory: (category: "inbox" | "finance" | "career" | "meetings") => void;
  markAsRead: (id: string) => void;
}

const mockEmails: EmailItem[] = [
  {
    id: "1",
    sender: "Stripe Billing",
    email: "invoices@stripe.com",
    subject: "Monthly Subscription Receipt - $49.00",
    snippet: "Your subscription payment for BriefMail Pro was successfully processed.",
    date: "10:42 AM",
    category: "finance",
    isUnread: true,
    isUrgent: true,
    amount: "-$49.00",
  },
  {
    id: "2",
    sender: "TechCorp Recruiting",
    email: "careers@techcorp.com",
    subject: "Senior Full Stack Engineer - Next Steps",
    snippet: "We were impressed with your application and would like to schedule a 45-min technical chat.",
    date: "09:15 AM",
    category: "career",
    isUnread: true,
    isUrgent: true,
  },
  {
    id: "3",
    sender: "Google Calendar",
    email: "calendar@google.com",
    subject: "Invitation: Product Architecture Sync @ 2:00 PM",
    snippet: "Meeting host Anubhav has invited you to join Google Meet for architecture sync.",
    date: "Yesterday",
    category: "meetings",
    isUnread: false,
  },
];

export const useEmailStore = create<EmailState>((set) => ({
  emails: mockEmails,
  selectedEmailId: "1",
  activeCategory: "inbox",
  setSelectedEmailId: (id) => set({ selectedEmailId: id }),
  setActiveCategory: (category) => set({ activeCategory: category }),
  markAsRead: (id) =>
    set((state) => ({
      emails: state.emails.map((e) => (e.id === id ? { ...e, isUnread: false } : e)),
    })),
}));
