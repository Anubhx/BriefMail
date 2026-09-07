import type { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/ui/Logo";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your BriefMail account to access your AI-triaged inbox.",
  alternates: {
    canonical: "https://briefmail.vercel.app/sign-in",
  },
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-canvas p-4 gap-6">
      <h1 className="sr-only">Sign In to BriefMail</h1>
      <Logo variant="long" width={170} height={32} href="/" priority />
      <SignIn />
    </div>
  );
}
