export interface EmailItem {
  id: string;
  sender: string;
  email: string;
  subject: string;
  snippet: string;
  date: string;
  category: "inbox" | "finance" | "career" | "meetings";
  isUnread: boolean;
  isUrgent?: boolean;
  amount?: string;
}

export interface FinanceSummary {
  totalDebits: number;
  totalCredits: number;
  pendingInvoices: number;
}

export interface CareerUpdate {
  company: string;
  role: string;
  status: "applied" | "interview" | "offer" | "rejected";
  date: string;
}

export interface MeetingItem {
  id: string;
  title: string;
  organizer: string;
  time: string;
  platform: string;
  link: string;
}
