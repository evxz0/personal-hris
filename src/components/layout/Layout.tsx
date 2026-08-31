"use client";

import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Menu } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const isSuperadmin = location.pathname.startsWith("/superadmin");

  // Sinkronkan warna dasar document.body agar saat scroll / overscroll tetap hitam
  useEffect(() => {
    if (isSuperadmin) {
      document.body.style.backgroundColor = "#0B1120";
      document.documentElement.style.backgroundColor = "#0B1120";
    } else {
      document.body.style.backgroundColor = "#F4F7F6";
      document.documentElement.style.backgroundColor = "#F4F7F6";
    }

    return () => {
      document.body.style.backgroundColor = "#F4F7F6";
      document.documentElement.style.backgroundColor = "#F4F7F6";
    };
  }, [isSuperadmin]);

  return (
    <div
      className={`min-h-screen w-full flex flex-col lg:flex-row transition-colors duration-200 ${
        isSuperadmin ? "bg-[#0B1120] text-slate-100" : "bg-[#F4F7F6] text-slate-900"
      }`}
    >
      {/* Mobile Header */}
      <header
        className={`lg:hidden flex items-center justify-between px-4 py-3 shadow-md sticky top-0 z-30 ${
          isSuperadmin ? "bg-slate-900 border-b border-slate-800 text-white" : "bg-teal-800 text-white"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-1.5 hover:bg-white/10 rounded-lg text-white transition-colors"
          >
            <Menu size={20}/>
          </button>
          <div className="flex items-center gap-2">
            <img src="/logo-bni.png" alt="TALOS Logo" className="h-7 w-auto object-contain" />
            <span className="text-sm font-extrabold tracking-wide">TALOS</span>
          </div>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <Sidebar collapsed={collapsed} mobileOpen={mobileOpen} setCollapsed={setCollapsed} setMobileOpen={setMobileOpen}/>

      {/* Main Content Area */}
      <main
        className={`flex-1 min-w-0 transition-all duration-300 ${
          collapsed ? "lg:ml-16" : "lg:ml-64"
        } ${isSuperadmin ? "bg-[#0B1120]" : "bg-[#F4F7F6]"}`}
      >
        <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
          {children}
        </div>
      </main>
    </div>
  );
}
