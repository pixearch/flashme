import { ClerkProvider } from '@clerk/nextjs'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import Navbar from '@/components/Navbar' // <--- 1. IMPORT THIS

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
  return (
    <ClerkProvider>
      <html lang="en">
        <body className={inter.className}>
          
          <Navbar />  {/* <--- 2. ADD THIS HERE */}
          
          <main className="min-h-screen bg-slate-50/50">
            {children}
          </main>
          
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  )
}
