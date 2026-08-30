import { LayoutDashboard, CheckCircle2 } from 'lucide-react'

export function DashboardHeroBanner() {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-lg border border-white/20 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between p-5 sm:p-7">
      {/* Panoramic Background Image */}
      <img
        src="/bg-home-hero.avif"
        alt="BNI TALOS Hero"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Dark gradient overlay for optimal glass contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/35 pointer-events-none" />

      {/* Top Breadcrumb */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white text-xs font-extrabold tracking-wide drop-shadow-md">
          <LayoutDashboard size={16} className="text-teal-300" />
          <span>Dashboard</span>
          <span className="text-white/60">/</span>
          <span className="text-white/90">Talent Administration & Legal Operations System (TALOS)</span>
        </div>
      </div>

      {/* Floating Glassmorphism Info Card (Transparent / Glass Background) */}
      <div className="relative z-10 max-w-lg bg-black/30 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/25 space-y-2.5 animate-fade-in-up">
        {/* Main Title */}
        <div>
          <h2 className="text-base sm:text-lg font-black text-white leading-tight drop-shadow-md">
            PT Bank Negara Indonesia (Persero) Tbk
          </h2>
          <p className="text-xs font-semibold text-white/85 mt-0.5 drop-shadow-sm">
            Regional Office 09 · Human Capital Information Portal
          </p>
        </div>

        {/* Tags / Pills with Glass Effect */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 backdrop-blur-md shadow-xs">
            <CheckCircle2 size={13} className="text-emerald-400" />
            Live System
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/25 backdrop-blur-md shadow-xs">
            Regional Office 09
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 text-white border border-white/25 backdrop-blur-md shadow-xs">
            Unit HC & SDM
          </span>
        </div>
      </div>
    </div>
  )
}
