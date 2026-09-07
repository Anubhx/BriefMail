import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Career Pipeline",
  description:
    "Track job applications, interview timelines, and offer letters — automatically synced and organised from your email.",
  robots: { index: false, follow: false },
};

export default function CareerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
