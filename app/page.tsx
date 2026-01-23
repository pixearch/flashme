import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
      <h1 className="text-5xl font-bold mb-6">FlashMaster</h1>
      
      <div className="flex gap-4">
        {userId ? (
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
        ) : (
            <Link href="/sign-in">
              <Button>Sign In to Start</Button>
            </Link>
        )}
      </div>
    </div>
  );
}
