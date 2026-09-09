import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description:
    "Configure your BriefMail workspace - Gmail sync, AI preferences, notification rules, and account management.",
  robots: { index: false, follow: false },
};

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
