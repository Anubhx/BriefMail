import type { Metadata } from "next";
import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Get Started",
  description: "Create your BriefMail account to connect Gmail and start intelligent email triage.",
  alternates: {
    canonical: "https://briefmail.vercel.app/sign-up",
  },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-canvas p-4 gap-6">
      <h1 className="sr-only">Create your BriefMail account</h1>
      <Logo variant="long" width={170} height={32} href="/" priority />
      <SignUp />
    </div>
  );
}
