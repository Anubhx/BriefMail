import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Meetings & Digests",
  description:
    "Upcoming meetings, AI-generated action items, and meeting digests extracted automatically from your inbox.",
  robots: { index: false, follow: false },
};

export default function MeetingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
