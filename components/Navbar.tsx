'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Layers, LayoutGrid, Zap } from "lucide-react"
import { UserButton, SignedIn, SignedOut, SignInButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container flex h-16 items-center mx-auto px-4 justify-between">
        
        {/* LEFT: Logo (Static) & Nav */}
        <div className="flex items-center gap-8">
          {/* Static Logo */}
          <div className="flex items-center space-x-2 select-none cursor-default opacity-90 hover:opacity-100 transition-opacity">
            <Zap className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="hidden font-bold sm:inline-block text-lg tracking-tight text-slate-900">FlashMe</span>
          </div>
          
          {/* Navigation Items */}
          <nav className="flex items-center space-x-6 text-sm font-medium">
            <Link 
              href="/dashboard" 
              className={cn(
                "transition-colors flex items-center gap-2",
                isActive("/dashboard") ? "text-black" : "text-slate-500 hover:text-black"
              )}
            >
              <Layers className="h-4 w-4" /> Decks
            </Link>

            {/* SPACES (Placeholder) */}
            <div 
                className="text-slate-300 flex items-center gap-2 cursor-not-allowed select-none" 
                title="Coming Soon: Collaborative Spaces"
            >
              <LayoutGrid className="h-4 w-4" /> Spaces
              <span className="bg-slate-100 text-[10px] px-1.5 py-0.5 rounded-full text-slate-400 font-bold">SOON</span>
            </div>
          </nav>
        </div>

        {/* RIGHT: Auth & Profile */}
        <div className="flex items-center gap-4">
          <SignedOut>
            {/* Single, clear entry point */}
            <SignInButton mode="modal">
              <Button size="sm">Log In</Button>
            </SignInButton>
          </SignedOut>
          
          <SignedIn>
            <UserButton 
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                  userButtonPopoverCard: "shadow-xl border border-slate-200"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  )
}
