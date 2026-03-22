import { SignUp } from "@clerk/nextjs";
import { isClerkConfigured } from "@/lib/clerk-config";

export default function Page() {
  if (!isClerkConfigured) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-50">
        <p className="text-sm text-slate-600">Authentication is not configured.</p>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50">
      <SignUp />
    </div>
  );
}
