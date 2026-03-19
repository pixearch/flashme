import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import Navbar from '@/components/Navbar'
import { clerkPublishableKey, isClerkConfigured } from '@/lib/clerk-config'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'FlashMe',
  description: 'The best flashcard app ever',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const app = (
    <html lang="en">
      <body className={inter.className}>
        <Navbar clerkEnabled={isClerkConfigured} />

        <main className="min-h-screen bg-slate-50/50">
          {children}
        </main>

        <Toaster />
      </body>
    </html>
  )

  if (!isClerkConfigured) {
    return app
  }

  return <ClerkProvider publishableKey={clerkPublishableKey!}>{app}</ClerkProvider>
}
