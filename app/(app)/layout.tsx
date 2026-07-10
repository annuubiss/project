import type React from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-dvh bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 sm:px-8 sm:py-10">
          {children}
        </main>
      </div>
    </div>
  )
}
