import { LayoutDashboard, CheckCircle2 } from 'lucide-react'

interface Props {
  totalKaryawan: number
  hadirRate: string
}

export function DashboardHeroBanner({ totalKaryawan, hadirRate }: Props) {
  return (
    <div className="relative rounded-3xl overflow-hidden shadow-md border border-gray-100/80 min-h-[220px] sm:min-h-[260px] flex flex-col justify-between p-5 sm:p-7">
      {/* Panoramic Background Image */}
      <img
        src="/bg-home-hero.avif"
        alt="BNI P-HRIS Hero"
        className="absolute inset-0 w-full h-full object-cover object-center"
      />

      {/* Subtle overlay for contrast */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-black/30 pointer-events-none" />

      {/* Top Breadcrumb */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white/95 text-xs font-extrabold tracking-wide drop-shadow-md">
          <LayoutDashboard size={16} className="text-white" />
          <span>Dashboard</span>
          <span className="text-white/60">/</span>
          <span className="text-white/90">Personal Human Resource Information System (P-HRIS)</span>
        </div>
      </div>

      {/* Floating Info Card (Bottom-Left) */}
      <div className="relative z-10 max-w-lg bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 shadow-2xl border border-white/90 space-y-3 animate-fade-in-up">
        {/* Main Title */}
        <div>
          <h2 className="text-base sm:text-lg font-black text-[#2B3440] leading-tight">
            PT Bank Negara Indonesia (Persero) Tbk
          </h2>
          <p className="text-xs font-semibold text-[#64748B] mt-0.5">
            Regional Office 09 · Human Capital Information Portal
          </p>
        </div>

        {/* Tags / Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-700" />
            Live System
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-[#475569] border border-gray-200">
            Regional Office 09
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-[#475569] border border-gray-200">
            Unit HC & SDM
          </span>
        </div>

        {/* Highlight Metrics */}
        <div className="grid grid-cols-3 gap-3 pt-2 border-t border-gray-100">
          <div>
            <span className="text-sm sm:text-base font-black text-[#2B3440] block leading-none">
              {totalKaryawan}
            </span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mt-1">
              Total SDM
            </span>
          </div>
          <div>
            <span className="text-sm sm:text-base font-black text-teal-700 block leading-none">
              {hadirRate}%
            </span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mt-1">
              Kehadiran
            </span>
          </div>
          <div>
            <span className="text-sm sm:text-base font-black text-orange-600 block leading-none">
              RO 09
            </span>
            <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block mt-1">
              Wilayah
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
