import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useIdleTimeout } from "./hooks/useIdleTimeout";
import { Layout } from "./components/layout/Layout";
import LoginPage from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import KaryawanPage from "./pages/Karyawan";
import BinaPage from "./pages/Bina";
import MagangPage from "./pages/Magang";
import AbsensiPage from "./pages/Absensi";
import SettingsPage from "./pages/Settings";
import RiwayatPage from "./pages/Riwayat";
import RiwayatSuratPage from "./pages/RiwayatSurat";
import SuratPgsPage from "./pages/surat/SuratPgs";
import SuratBalasanCutiPage from "./pages/surat/SuratBalasanCuti";
import SuratKeteranganKerjaPage from "./pages/surat/SuratKeteranganKerja";
import SuratCustomPage from "./pages/surat/SuratCustom";
import SuratBaCashOpnamePage from "./pages/surat/SuratBaCashOpname";
import SuperadminPage from "./pages/Superadmin";
import { initRealtimeSessionTracker } from './lib/sessionTracker';
import { useEffect } from "react";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-xl animate-pulse">
            <span className="text-white font-black text-sm tracking-tighter">TALOS</span>
          </div>
          <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-[#64748B] font-medium">Memuat TALOS...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate replace to="/login" />;
  return <Layout>{children}</Layout>;
}

function SuperadminRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-xl animate-pulse">
            <span className="text-white font-black text-sm tracking-tighter">TALOS</span>
          </div>
          <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-[#64748B] font-medium">Memuat TALOS...</p>
        </div>
      </div>
    );
  }
  
  if (!user) return <Navigate replace to="/login" />;
  if (user.role !== "SUPERADMIN") return <Navigate replace to="/" />;
  return <Layout>{children}</Layout>;
}

function LoginRoute() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F7F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-teal-700 flex items-center justify-center shadow-xl animate-pulse">
            <span className="text-white font-black text-sm tracking-tighter">TALOS</span>
          </div>
          <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
          <p className="text-sm text-[#64748B] font-medium">Memuat TALOS...</p>
        </div>
      </div>
    );
  }
  
  if (user) {
    const isOric = 
      user.role?.toUpperCase() === 'ORIC' || 
      user.username?.toLowerCase() === 'oric' ||
      (user as any).email?.toLowerCase().includes('oric');

    if (user.role === "SUPERADMIN") return <Navigate replace to="/superadmin" />;
    if (isOric) return <Navigate replace to="/surat/ba-cash-opname" />;
    return <Navigate replace to="/" />;
  }
  
  return <LoginPage />;
}

function AppRoutes() {
  const { user } = useAuth();
  const isOric = 
    user?.role?.toUpperCase() === 'ORIC' || 
    user?.username?.toLowerCase() === 'oric' ||
    (user as any)?.email?.toLowerCase().includes('oric');
  
  useIdleTimeout(!!user);
  
  useEffect(() => {
    if (user) {
      initRealtimeSessionTracker(user);
    }
  }, [user]);

  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      {/* Rute Surat Keterangan (Bisa diakses semua termasuk ORIC) */}
      <Route path="/surat/pgs" element={<ProtectedRoute><SuratPgsPage /></ProtectedRoute>} />
      <Route path="/surat/balasan-cuti" element={<ProtectedRoute><SuratBalasanCutiPage /></ProtectedRoute>} />
      <Route path="/surat/keterangan-kerja" element={<ProtectedRoute><SuratKeteranganKerjaPage /></ProtectedRoute>} />
      <Route path="/surat/custom" element={<ProtectedRoute><SuratCustomPage /></ProtectedRoute>} />
      <Route path="/surat/ba-cash-opname" element={<ProtectedRoute><SuratBaCashOpnamePage /></ProtectedRoute>} />

      {/* Proteksi khusus ORIC: tendang dari rute yang dilarang */}
      {isOric && (
        <>
          <Route path="/" element={<Navigate replace to="/surat/ba-cash-opname" />} />
          <Route path="/dashboard" element={<Navigate replace to="/surat/ba-cash-opname" />} />
          <Route path="/karyawan" element={<Navigate replace to="/surat/ba-cash-opname" />} />
          <Route path="/bina" element={<Navigate replace to="/surat/ba-cash-opname" />} />
          <Route path="/magang" element={<Navigate replace to="/surat/ba-cash-opname" />} />
          <Route path="/absensi" element={<Navigate replace to="/surat/ba-cash-opname" />} />
          <Route path="/riwayat" element={<Navigate replace to="/surat/ba-cash-opname" />} />
          <Route path="/riwayat/karyawan" element={<Navigate replace to="/surat/ba-cash-opname" />} />
          <Route path="/riwayat/surat" element={<Navigate replace to="/surat/ba-cash-opname" />} />
          <Route path="/settings" element={<Navigate replace to="/surat/ba-cash-opname" />} />
        </>
      )}

      {/* Rute normal untuk user selain ORIC */}
      {!isOric && (
        <>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/karyawan" element={<ProtectedRoute><KaryawanPage /></ProtectedRoute>} />
          <Route path="/bina" element={<ProtectedRoute><BinaPage /></ProtectedRoute>} />
          <Route path="/magang" element={<ProtectedRoute><MagangPage /></ProtectedRoute>} />
          <Route path="/absensi" element={<ProtectedRoute><AbsensiPage /></ProtectedRoute>} />
          <Route path="/riwayat" element={<Navigate replace to="/riwayat/karyawan" />} />
          <Route path="/riwayat/karyawan" element={<ProtectedRoute><RiwayatPage /></ProtectedRoute>} />
          <Route path="/riwayat/surat" element={<ProtectedRoute><RiwayatSuratPage /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        </>
      )}

      <Route path="/superadmin" element={<SuperadminRoute><SuperadminPage /></SuperadminRoute>} />

      <Route path="*" element={<Navigate replace to={isOric ? "/surat/ba-cash-opname" : "/"} />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
