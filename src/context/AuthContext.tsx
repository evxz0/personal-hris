"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { authService, type AppUser } from "../lib/authService";

interface AuthContextType {
  user: AppUser | null;
  login: (username: string, passwordPlain: string) => Promise<{ success: boolean; user?: AppUser; message?: string }>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Inisialisasi sesi saat aplikasi pertama kali dimuat
    const session = authService.getSession();
    setUser(session);
    setIsLoading(false);

    // Sinkronisasi jika user login/logout di tab peramban lain
    const handleStorageChange = () => {
      setUser(authService.getSession());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (username: string, passwordPlain: string) => {
    const res = await authService.login(username, passwordPlain);
    if (res.success && res.user) {
      setUser(res.user); // Re-render state React seketika di tab aktif
    }
    return res;
  };

  const logout = () => {
    authService.logout();
    setUser(null); // Kosongkan state seketika
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
};
