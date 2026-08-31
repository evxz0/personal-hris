import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Menu } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()

  // Cek apakah halaman yang dibuka adalah Superadmin
  const isSuperadminPage = location.pathname.startsWith('/superadmin')

  return (
    <div
      className={`flex h-full min-h-screen flex-col lg:flex-row transition-colors duration-200 ${
        isSuperadminPage ? 'bg-[#0B1120]' : 'bg-[#F4F7F6]'
      }`}
    >
      {/* Mobile Header/Navbar */}
      <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-teal-800 text-white shadow-md sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 hover:bg-teal-700 rounded-lg text-white transition-colors"
          >
            <Menu size={20}/>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo-bni.png" alt="TALOS Logo" className="h-7 w-auto object-contain" />
            <span className="text-sm font-extrabold tracking-wide">TALOS</span>
          </div>
        </div>
      </header>

      {/* Sidebar Navigasi */}
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} setCollapsed={setCollapsed} setMobileOpen={setMobileOpen}/>

      {/* Main Content Area */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ${
          collapsed ? 'lg:ml-16' : 'lg:ml-64'
        } ${isSuperadminPage ? 'bg-[#0B1120]' : 'bg-[#F4F7F6]'}`}
      >
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
