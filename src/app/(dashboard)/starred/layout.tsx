import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Starred",
  description:
    "Emails you've starred for quick follow-up — surface important threads without losing them.",
  robots: { index: false, follow: false },
};

export default function StarredLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
