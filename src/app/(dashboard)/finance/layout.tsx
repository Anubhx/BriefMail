import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Finance & Accounts",
  description:
    "Automated bank statement parsing, EMI tracker, SIP investments, and subscription management - all surfaced from your inbox.",
  robots: { index: false, follow: false },
};

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
