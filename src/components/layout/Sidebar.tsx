import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap,
  CalendarOff, Settings, FileText, ChevronDown,
  ChevronLeft, LogOut, X, ArrowRightLeft, UserCheck, ShieldAlert
} from 'lucide-react'
import { recordUserLogout } from '../../lib/sessionTracker'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { to: '/', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/karyawan', icon: <Users size={18} />, label: 'Master Karyawan' },
  { to: '/bina', icon: <UserCheck size={18} />, label: 'Master Bina' },
  { to: '/magang', icon: <GraduationCap size={18} />, label: 'Master Magang' },
  { to: '/absensi', icon: <CalendarOff size={18} />, label: 'Absensi' },
]

const suratSubItems = [
  { to: '/surat/pgs', label: 'Untuk Pengganti Sementara' },
  { to: '/surat/balasan-cuti', label: 'Untuk Balasan Cuti' },
  { to: '/surat/keterangan-kerja', label: 'Surat Keterangan Kerja' },
  { to: '/surat/ba-cash-opname', label: 'BA Cash Opname' },
  { to: '/surat/custom', label: '+ Upload Template' },
]

const riwayatSubItems = [
  { to: '/riwayat/karyawan', label: 'Riwayat Karyawan' },
  { to: '/riwayat/surat', label: 'Riwayat Surat' },
]

interface SidebarProps {
  collapsed: boolean
  setCollapsed: React.Dispatch<React.SetStateAction<boolean>>
  mobileOpen: boolean
  setMobileOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const { user, logout } = useAuth()
  const isSuperadmin = user?.role === 'SUPERADMIN'
  const isSuratActive = location.pathname.startsWith('/surat')
  const isRiwayatActive = location.pathname.startsWith('/riwayat')

  const [suratOpen, setSuratOpen] = useState(isSuratActive)
  const [riwayatOpen, setRiwayatOpen] = useState(isRiwayatActive)

  useEffect(() => {
    if (isSuratActive) setSuratOpen(true)
    if (isRiwayatActive) setRiwayatOpen(true)
  }, [location.pathname])

  const handleLogout = async () => {
    await recordUserLogout().catch(console.error)
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen z-50 flex flex-col
        bg-gradient-to-b from-teal-700 to-teal-900 text-white
        transition-all duration-300 ease-in-out shadow-2xl
        ${collapsed ? 'w-16' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo & Toggle Header */}
        <div className={`flex items-center ${collapsed ? 'flex-col gap-2.5 py-4 px-2' : 'justify-between px-4 py-5'} border-b border-teal-600/50 transition-all`}>
          {/* Header Logo & Subtitle Sidebar */}
          {!collapsed ? (
            <div className="flex items-center gap-3 animate-fade-in max-w-[190px]">
              <div className="w-10 h-10 rounded-xl bg-[#E85022] flex items-center justify-center shadow-md shrink-0">
                <img
                  src="/logo-bni.png"
                  alt="TALOS"
                  className="w-7 h-7 object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
              <div className="overflow-hidden">
                <h2 className="text-base font-black tracking-wider text-white leading-none">
                  TALOS
                </h2>
                <p className="text-[9px] text-teal-200/90 mt-1 leading-tight font-medium line-clamp-2">
                  Talent Administration &amp; Legal Operations System
                </p>
              </div>
            </div>
          ) : (
            <div
              onClick={() => setCollapsed(false)}
              className="cursor-pointer hover:scale-105 transition-transform flex flex-col items-center gap-1 py-1"
              title="TALOS (Klik untuk memperluas sidebar)"
            >
              <div className="w-10 h-10 rounded-xl bg-[#E85022] flex items-center justify-center shadow-md mx-auto">
                <span className="text-white font-black text-xs tracking-tighter">TALOS</span>
              </div>
            </div>
          )}

          {/* Collapse button desktop */}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-teal-600/50 transition-colors text-teal-300 hover:text-white cursor-pointer"
            title={collapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
          >
            <ChevronLeft size={16} className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>

          {/* Close button mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden p-1 rounded-lg hover:bg-teal-600/50 text-teal-300"
          >
            <X size={16} />
          </button>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 overflow-y-auto sidebar-scroll py-4 px-2 space-y-1.5 overflow-x-hidden">
          {navItems.slice(0, 5).map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center rounded-xl font-medium text-sm
                transition-all duration-200 group relative overflow-hidden
                ${collapsed ? 'justify-center py-3 px-0' : 'gap-3 px-3 py-2.5'}
                ${isActive
                  ? 'bg-white/20 text-white shadow-sm font-bold border-l-4 border-orange-400'
                  : 'text-teal-200 hover:bg-white/10 hover:text-white'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  <span className={`shrink-0 ${isActive ? 'text-white' : 'text-teal-300 group-hover:text-white'}`}>
                    {item.icon}
                  </span>
                  {!collapsed && <span className="truncate animate-fade-in">{item.label}</span>}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-teal-900/95 text-white text-xs font-semibold rounded-xl shadow-xl border border-teal-700/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      {item.label}
                    </div>
                  )}
                </>
              )}
            </NavLink>
          ))}

          {/* Dropdown Surat Keterangan */}
          <div className="space-y-1 pt-1 relative group">
            <button
              type="button"
              onClick={() => setSuratOpen(!suratOpen)}
              className={`w-full flex items-center rounded-xl font-medium text-sm transition-all duration-200 ${
                collapsed ? 'justify-center py-3 px-0' : 'justify-between px-3 py-2.5'
              } ${
                isSuratActive ? 'bg-white/15 text-white shadow-sm font-bold' : 'text-teal-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <FileText size={18} className="shrink-0 text-teal-300 group-hover:text-white" />
                {!collapsed && (
                  <span className="truncate">Surat Keterangan</span>
                )}
              </div>
              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={`text-teal-300 transition-transform duration-200 ${suratOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {/* Sub items when EXPANDED */}
            {suratOpen && !collapsed && (
              <div className="pl-6 space-y-1 text-xs animate-fade-in">
                {suratSubItems.map(sub => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-150 relative
                      ${isActive
                        ? 'text-white bg-white/20 font-bold'
                        : 'text-teal-200 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <span className="truncate">{sub.label}</span>
                  </NavLink>
                ))}
              </div>
            )}

            {/* Sub items Flyout when COLLAPSED */}
            {collapsed && (
              <div className="absolute left-full top-0 ml-2 py-2 px-1 bg-teal-900/95 border border-teal-700/60 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto min-w-[200px] z-50 backdrop-blur-md">
                <div className="px-3 py-1 text-[11px] font-bold text-teal-300 border-b border-teal-800/80 mb-1">
                  Surat Keterangan
                </div>
                {suratSubItems.map(sub => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `
                      block px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                      ${isActive ? 'text-white bg-white/20 font-bold' : 'text-teal-100 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    {sub.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Dropdown Riwayat */}
          <div className="space-y-1 pt-1 relative group">
            <button
              type="button"
              onClick={() => setRiwayatOpen(!riwayatOpen)}
              className={`w-full flex items-center rounded-xl font-medium text-sm transition-all duration-200 ${
                collapsed ? 'justify-center py-3 px-0' : 'justify-between px-3 py-2.5'
              } ${
                isRiwayatActive ? 'bg-white/15 text-white shadow-sm font-bold' : 'text-teal-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'}`}>
                <ArrowRightLeft size={18} className="shrink-0 text-teal-300 group-hover:text-white" />
                {!collapsed && (
                  <span className="truncate">Riwayat</span>
                )}
              </div>
              {!collapsed && (
                <ChevronDown
                  size={16}
                  className={`text-teal-300 transition-transform duration-200 ${riwayatOpen ? 'rotate-180' : ''}`}
                />
              )}
            </button>

            {/* Sub items when EXPANDED */}
            {riwayatOpen && !collapsed && (
              <div className="pl-6 space-y-1 text-xs animate-fade-in">
                {riwayatSubItems.map(sub => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `
                      flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-all duration-150 relative
                      ${isActive
                        ? 'text-white bg-white/20 font-bold'
                        : 'text-teal-200 hover:text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <span className="truncate">{sub.label}</span>
                  </NavLink>
                ))}
              </div>
            )}

            {/* Sub items Flyout when COLLAPSED */}
            {collapsed && (
              <div className="absolute left-full top-0 ml-2 py-2 px-1 bg-teal-900/95 border border-teal-700/60 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-auto min-w-[180px] z-50 backdrop-blur-md">
                <div className="px-3 py-1 text-[11px] font-bold text-teal-300 border-b border-teal-800/80 mb-1">
                  Riwayat
                </div>
                {riwayatSubItems.map(sub => (
                  <NavLink
                    key={sub.to}
                    to={sub.to}
                    onClick={() => setMobileOpen(false)}
                    className={({ isActive }) => `
                      block px-3 py-1.5 text-xs font-medium rounded-lg transition-colors
                      ${isActive ? 'text-white bg-white/20 font-bold' : 'text-teal-100 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    {sub.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Settings */}
          <NavLink
            to="/settings"
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `
              flex items-center rounded-xl font-medium text-sm
              transition-all duration-200 group relative
              ${collapsed ? 'justify-center py-3 px-0' : 'gap-3 px-3 py-2.5'}
              ${isActive
                ? 'bg-white/15 text-white shadow-sm font-bold'
                : 'text-teal-200 hover:bg-white/10 hover:text-white'
              }
            `}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-orange-400 rounded-r-full" />
                )}
                <span className={`shrink-0 ${isActive ? 'text-white' : 'text-teal-300 group-hover:text-white'}`}>
                  <Settings size={18} />
                </span>
                {!collapsed && <span className="truncate animate-fade-in">Pengaturan</span>}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-3 py-1.5 bg-teal-900/95 text-white text-xs font-semibold rounded-xl shadow-xl border border-teal-700/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                    Pengaturan
                  </div>
                )}
              </>
            )}
          </NavLink>

          {/* Superadmin Control Center (Hanya tampil untuk Superadmin) */}
          {isSuperadmin && (
            <NavLink
              to="/superadmin"
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) => `
                flex items-center rounded-xl font-semibold text-xs mt-1
                transition-all duration-200 group relative border
                ${collapsed ? 'justify-center py-3 px-0' : 'gap-3 px-3 py-2.5'}
                ${isActive
                  ? 'bg-slate-900 text-teal-300 border-teal-500/50 shadow-md'
                  : 'bg-teal-800/40 text-teal-100 border-teal-600/40 hover:bg-slate-900/70 hover:text-teal-200'
                }
              `}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-teal-400 rounded-r-full" />
                  )}
                  <span className={`shrink-0 ${isActive ? 'text-teal-300' : 'text-teal-300 group-hover:text-teal-200'}`}>
                    <ShieldAlert size={18} />
                  </span>
                  {!collapsed && (
                    <div className="truncate flex items-center justify-between flex-1">
                      <span className="font-bold">Superadmin Panel</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500 text-slate-950 font-black">ADMIN</span>
                    </div>
                  )}
                  {collapsed && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-slate-900 text-teal-300 text-xs font-bold rounded-xl shadow-xl border border-teal-500/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                      Superadmin Panel
                    </div>
                  )}
                </>
              )}
            </NavLink>
          )}
        </nav>

        {/* Bottom Action Area */}
        <div className={`py-3 border-t border-teal-600/50 ${collapsed ? 'px-1' : 'px-2'}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center rounded-xl text-teal-200 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 text-sm font-medium cursor-pointer relative group ${collapsed ? 'justify-center py-3' : 'gap-3 px-3 py-2.5'}`}
          >
            <LogOut size={18} className="shrink-0" />
            {!collapsed && <span>Keluar</span>}
            {collapsed && (
              <div className="absolute left-full ml-3 px-3 py-1.5 bg-red-950 text-red-200 text-xs font-semibold rounded-xl shadow-xl border border-red-800/50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                Keluar
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}
