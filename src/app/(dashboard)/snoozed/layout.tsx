import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Snoozed",
  description:
    "Emails snoozed for later — they'll resurface automatically when you're ready to action them.",
  robots: { index: false, follow: false },
};

export default function SnoozedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
