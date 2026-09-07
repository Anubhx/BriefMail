import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Inbox",
  description:
    "Your AI-triaged inbox — emails categorised, prioritised, and ready to action in one clean view.",
  robots: { index: false, follow: false },
};

export default function InboxLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
