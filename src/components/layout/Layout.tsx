import React from 'react'
import { Sidebar } from './Sidebar'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex h-full min-h-screen bg-[#F4F7F6]">
      <Sidebar />
      {/* Main content - offset by sidebar width */}
      <main className="flex-1 min-w-0 lg:ml-64 transition-all duration-300">
        <div className="min-h-screen p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
