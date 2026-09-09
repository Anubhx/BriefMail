import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "System",
  description:
    "BriefMail system status - queue health, background job monitoring, and sync pipeline diagnostics.",
  robots: { index: false, follow: false },
};

export default function SystemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
