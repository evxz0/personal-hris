import { useState } from 'react'
import { Users, UserCheck, GraduationCap, CalendarOff, BarChart3, TrendingUp, ShieldCheck, Layers } from 'lucide-react'

interface KaryawanItem {
  id: string
  kategori?: string
  jenjang?: string
  grade?: number | string
  outlet?: string
  jenis_kelamin?: string
}

interface MagangItem {
  id: string
}

interface AbsensiItem {
  id: string
  jenis?: string
  kategori?: string
}

interface Props {
  karyawan: KaryawanItem[]
  magang: MagangItem[]
  absensi: AbsensiItem[]
}

export function DashboardAnalyticsHeader({ karyawan = [], magang = [], absensi = [] }: Props) {
  const [chartMetric, setChartMetric] = useState<'count' | 'percent'>('count')

  // Counts
  const totalKaryawan = karyawan.length
  const fteCount = karyawan.filter(k => k.kategori === 'FTE').length
  const tadCount = karyawan.filter(k => k.kategori === 'TAD').length
  const binaCount = karyawan.filter(k => k.kategori === 'BINA').length
  const magangCount = magang.length
  const absensiCount = absensi.length

  const totalTenagaKerja = totalKaryawan + magangCount
  const hadirCount = Math.max(0, totalKaryawan - absensiCount)
  const hadirRate = totalKaryawan > 0 ? ((hadirCount / totalKaryawan) * 100).toFixed(1) : '100'

  // Jenjang Breakdown
  const jenjangCounts = {
    VP: karyawan.filter(k => k.jenjang === 'VP').length,
    AVP: karyawan.filter(k => k.jenjang === 'AVP').length,
    MGR: karyawan.filter(k => k.jenjang === 'MGR').length,
    AMGR: karyawan.filter(k => k.jenjang === 'AMGR').length,
    ASST: karyawan.filter(k => k.jenjang === 'ASST').length,
    Lainnya: karyawan.filter(k => !['VP', 'AVP', 'MGR', 'AMGR', 'ASST'].includes(k.jenjang || '')).length,
  }

  // Bar Chart Data (Vertical / Column Diagram)
  const categoryChartData = [
    { label: 'FTE (Organik)', count: fteCount, color: 'from-teal-600 to-teal-500', barBg: 'bg-teal-500', badgeBg: 'bg-teal-50 text-teal-800 border-teal-200' },
    { label: 'TAD (Alih Daya)', count: tadCount, color: 'from-orange-500 to-amber-500', barBg: 'bg-orange-500', badgeBg: 'bg-orange-50 text-orange-800 border-orange-200' },
    { label: 'Program Bina', count: binaCount, color: 'from-blue-600 to-cyan-500', barBg: 'bg-blue-500', badgeBg: 'bg-blue-50 text-blue-800 border-blue-200' },
    { label: 'Magang Aktif', count: magangCount, color: 'from-purple-600 to-indigo-500', barBg: 'bg-purple-500', badgeBg: 'bg-purple-50 text-purple-800 border-purple-200' },
    { label: 'Sakit & Cuti', count: absensiCount, color: 'from-rose-500 to-red-500', barBg: 'bg-rose-500', badgeBg: 'bg-rose-50 text-rose-800 border-rose-200' },
  ]

  // Max value for bar scaling (minimum 5 to avoid div by zero)
  const maxCount = Math.max(...categoryChartData.map(d => d.count), 5)

  return (
    <div className="space-y-6">
      {/* 4 Executive KPI Metric Cards with Mini Trend Visualizers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Karyawan */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-700">
              <Users size={22} />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
              {totalTenagaKerja} Total SDM
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">Total Karyawan</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-[#2B3440]">{totalKaryawan}</span>
              <span className="text-xs text-teal-700 font-bold">Pegawai</span>
            </div>
          </div>
          {/* Mini multi-segment progress bar */}
          <div className="mt-3.5 space-y-1.5">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${totalKaryawan > 0 ? (fteCount / totalKaryawan) * 100 : 0}%` }}
                className="bg-teal-500 h-full transition-all duration-500"
                title={`FTE: ${fteCount}`}
              />
              <div
                style={{ width: `${totalKaryawan > 0 ? (tadCount / totalKaryawan) * 100 : 0}%` }}
                className="bg-orange-500 h-full transition-all duration-500"
                title={`TAD: ${tadCount}`}
              />
              <div
                style={{ width: `${totalKaryawan > 0 ? (binaCount / totalKaryawan) * 100 : 0}%` }}
                className="bg-blue-500 h-full transition-all duration-500"
                title={`BINA: ${binaCount}`}
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#64748B] font-bold">
              <span className="text-teal-700">FTE: {fteCount}</span>
              <span className="text-orange-600">TAD: {tadCount}</span>
              <span className="text-blue-600">BINA: {binaCount}</span>
            </div>
          </div>
        </div>

        {/* Card 2: Program Bina BNI */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-600">
              <UserCheck size={22} />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700 border border-orange-100">
              Program Bina
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">Tenaga BINA BNI</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-[#2B3440]">{binaCount}</span>
              <span className="text-xs text-orange-600 font-bold">Peserta</span>
            </div>
          </div>
          {/* Mini visual ratio bar */}
          <div className="mt-3.5 space-y-1.5">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${totalKaryawan > 0 ? (binaCount / totalKaryawan) * 100 : 0}%` }}
                className="bg-orange-500 h-full rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#64748B] font-semibold">
              <span>Porsi BINA</span>
              <span className="font-bold text-orange-600">
                {totalKaryawan > 0 ? ((binaCount / totalKaryawan) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Card 3: Magang Aktif */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
              <GraduationCap size={22} />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
              Internship
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">Magang Aktif</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-[#2B3440]">{magangCount}</span>
              <span className="text-xs text-purple-600 font-bold">Mahasiswa</span>
            </div>
          </div>
          {/* Mini visual bar */}
          <div className="mt-3.5 space-y-1.5">
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
              <div
                style={{ width: `${totalTenagaKerja > 0 ? (magangCount / totalTenagaKerja) * 100 : 0}%` }}
                className="bg-purple-500 h-full rounded-full transition-all duration-500"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#64748B] font-semibold">
              <span>Status</span>
              <span className="font-bold text-purple-700">Terdaftar Aktif</span>
            </div>
          </div>
        </div>

        {/* Card 4: Absensi & Kehadiran Hari Ini */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600">
              <CalendarOff size={22} />
            </div>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 flex items-center gap-1">
              <ShieldCheck size={12} /> {hadirRate}% Hadir
            </span>
          </div>
          <div className="mt-4">
            <p className="text-xs text-[#64748B] font-semibold uppercase tracking-wider">Absensi Hari Ini</p>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-3xl font-black text-[#2B3440]">{absensiCount}</span>
              <span className="text-xs text-rose-600 font-bold">Sakit / Cuti</span>
            </div>
          </div>
          {/* Mini attendance bar */}
          <div className="mt-3.5 space-y-1.5">
            <div className="w-full bg-emerald-100 h-2 rounded-full overflow-hidden flex">
              <div
                style={{ width: `${hadirRate}%` }}
                className="bg-emerald-500 h-full transition-all duration-500"
                title="Hadir Aktif"
              />
              <div
                style={{ width: `${100 - parseFloat(hadirRate)}%` }}
                className="bg-rose-500 h-full transition-all duration-500"
                title="Cuti/Sakit"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[#64748B] font-semibold">
              <span className="text-emerald-700 font-bold">{hadirCount} Hadir</span>
              <span className="text-rose-600 font-bold">{absensiCount} Cuti/Sakit</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Visual Diagram Panel (Dual-Column Analytics: Bar Chart & Distribution Matrix) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left Diagram: Vertical Column / Bar Analytics (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-700">
                  <BarChart3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#2B3440] leading-tight">
                    Diagram Komposisi & Distribusi Tenaga Kerja
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Perbandingan jumlah personil per kategori dan status</p>
                </div>
              </div>

              {/* View Metric Toggle */}
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setChartMetric('count')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    chartMetric === 'count'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-[#64748B] hover:text-[#2B3440]'
                  }`}
                >
                  Jumlah (Orang)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('percent')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    chartMetric === 'percent'
                      ? 'bg-white text-teal-800 shadow-xs'
                      : 'text-[#64748B] hover:text-[#2B3440]'
                  }`}
                >
                  Persentase (%)
                </button>
              </div>
            </div>

            {/* Vertical Bar Chart Graphic */}
            <div className="h-56 flex items-end justify-between gap-3 pt-6 pb-2 px-2">
              {categoryChartData.map(item => {
                const heightPercent = maxCount > 0 ? (item.count / maxCount) * 100 : 0
                const sharePercent = totalTenagaKerja > 0 ? ((item.count / totalTenagaKerja) * 100).toFixed(1) : '0'

                return (
                  <div key={item.label} className="flex-1 flex flex-col items-center h-full justify-end group">
                    {/* Bar Value Tooltip / Label */}
                    <div className="mb-2 transition-all duration-200 transform group-hover:-translate-y-1 text-center">
                      <span className="text-xs font-black text-[#2B3440] block leading-none">
                        {chartMetric === 'count' ? item.count : `${sharePercent}%`}
                      </span>
                      {chartMetric === 'count' && (
                        <span className="text-[10px] text-[#64748B] font-semibold block mt-0.5">
                          {sharePercent}%
                        </span>
                      )}
                    </div>

                    {/* Bar Column with Gradient */}
                    <div className="w-full max-w-[56px] bg-gray-100 rounded-xl overflow-hidden flex flex-col justify-end p-1 relative h-36">
                      <div
                        style={{ height: `${Math.max(heightPercent, 8)}%` }}
                        className={`w-full bg-gradient-to-t ${item.color} rounded-lg shadow-sm transition-all duration-700 group-hover:brightness-110`}
                      />
                    </div>

                    {/* Category Label */}
                    <p className="text-[11px] font-bold text-[#2B3440] text-center mt-3 leading-tight line-clamp-1 w-full truncate" title={item.label}>
                      {item.label}
                    </p>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Bottom Summary Bar */}
          <div className="mt-4 pt-3 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs text-[#64748B]">
            <div className="flex items-center gap-1.5 font-semibold">
              <TrendingUp size={14} className="text-teal-600" />
              <span>Total SDM Terkelola: <strong className="text-teal-800 font-extrabold">{totalTenagaKerja} Personil</strong></span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-teal-500" /> FTE</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-500" /> TAD</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> BINA</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> Magang</span>
            </div>
          </div>
        </div>

        {/* Right Diagram: Breakdown Jenjang & Struktur Organisasi (5 Cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                  <Layers size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#2B3440] leading-tight">
                    Struktur Jenjang Jabatan
                  </h3>
                  <p className="text-[11px] text-[#64748B]">Distribusi level pegawai di Regional Office 09</p>
                </div>
              </div>
            </div>

            {/* Horizontal Bar Breakdown for Jenjang */}
            <div className="space-y-3 pt-1">
              {[
                { name: 'Vice President (VP)', count: jenjangCounts.VP, color: 'bg-indigo-600', text: 'text-indigo-700' },
                { name: 'Assistant Vice President (AVP)', count: jenjangCounts.AVP, color: 'bg-blue-600', text: 'text-blue-700' },
                { name: 'Manager (MGR)', count: jenjangCounts.MGR, color: 'bg-teal-600', text: 'text-teal-700' },
                { name: 'Assistant Manager (AMGR)', count: jenjangCounts.AMGR, color: 'bg-cyan-600', text: 'text-cyan-700' },
                { name: 'Assistant (ASST)', count: jenjangCounts.ASST, color: 'bg-orange-500', text: 'text-orange-700' },
                { name: 'Staff / Non-Jenjang', count: jenjangCounts.Lainnya, color: 'bg-gray-400', text: 'text-gray-700' },
              ].map(j => {
                const pct = totalKaryawan > 0 ? ((j.count / totalKaryawan) * 100).toFixed(1) : '0'
                const barWidth = totalKaryawan > 0 ? (j.count / totalKaryawan) * 100 : 0

                return (
                  <div key={j.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-[#2B3440] text-[11px]">{j.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[11px] font-black ${j.text}`}>{j.count}</span>
                        <span className="text-[10px] text-[#64748B]">({pct}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${Math.max(barWidth, j.count > 0 ? 3 : 0)}%` }}
                        className={`${j.color} h-full rounded-full transition-all duration-500`}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-[#64748B]">
            <span className="font-semibold">Format Jenjang Standar SK</span>
            <span className="font-extrabold text-teal-800">Regional 09</span>
          </div>
        </div>
      </div>
    </div>
  )
}
