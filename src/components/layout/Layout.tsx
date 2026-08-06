import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { Menu } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-full min-h-screen bg-[#F4F7F6] flex-col lg:flex-row">
      {/* Mobile Header/Navbar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-teal-700 text-white shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 hover:bg-teal-600/50 rounded-lg text-white transition-colors"
          >
            <Menu size={20} />
          </button>
          <span className="text-sm font-extrabold tracking-wide">P-HRIS</span>
        </div>
      </header>

      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main content - offset by sidebar width on desktop */}
      <main className={`flex-1 min-w-0 transition-all duration-300 ${collapsed ? 'lg:ml-16' : 'lg:ml-64'}`}>
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
