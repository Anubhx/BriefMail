import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/ui/Logo";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-canvas p-4 gap-6">
      <Logo variant="long" width={170} height={32} href="/" priority />
      <SignIn />
    </div>
  );
}
