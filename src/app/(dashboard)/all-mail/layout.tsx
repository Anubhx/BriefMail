import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "All Mail",
  description:
    "Your complete email archive — filter, search, and triage across every category in one place.",
  robots: { index: false, follow: false },
};

export default function AllMailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
