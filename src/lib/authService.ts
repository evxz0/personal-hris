import { supabase } from "./supabase";

export interface AppUser {
  id: string;
  username: string;
  nama: string;
  role: "SUPERADMIN" | "ADMIN_HR" | "OPERATOR" | "VIEWER" | "ORIC";
  status_aktif: boolean;
  created_at?: string;
}

// Helper SHA-256 Hash menggunakan Web Crypto API bawaan browser
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password.trim());
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

const SESSION_KEY = "phris_custom_session";

export const authService = {
  // Login
  async login(username: string, passwordPlain: string): Promise<{ success: boolean; user?: AppUser; message?: string }> {
    try {
      const cleanUser = username.trim().toLowerCase();
      const hash = await hashPassword(passwordPlain);

      const { data, error } = await supabase
        .from("app_users")
        .select("id, username, nama, password_hash, role, status_aktif, created_at")
        .eq("username", cleanUser)
        .single();

      if (error || !data) {
        return { success: false, message: "Username atau NPP tidak terdaftar." };
      }

      if (!data.status_aktif) {
        return { success: false, message: "Akun ini dinonaktifkan. Hubungi Superadmin." };
      }

      if (data.password_hash !== hash) {
        return { success: false, message: "Password salah. Silakan periksa kembali." };
      }

      const userSession: AppUser = {
        id: data.id,
        username: data.username,
        nama: data.nama,
        role: data.role as any,
        status_aktif: data.status_aktif,
        created_at: data.created_at,
      };

      localStorage.setItem(SESSION_KEY, JSON.stringify(userSession));
      return { success: true, user: userSession };
    } catch (err: any) {
      return { success: false, message: err.message || "Terjadi kesalahan saat login." };
    }
  },

  // Get Active Session
  getSession(): AppUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AppUser;
    } catch {
      return null;
    }
  },

  // Logout
  logout(): void {
    localStorage.removeItem(SESSION_KEY);
  },

  // SUPERADMIN CRUD OPERATIONS
  async getAllUsers(): Promise<AppUser[]> {
    const { data } = await supabase
      .from("app_users")
      .select("id, username, nama, role, status_aktif, created_at")
      .order("created_at", { ascending: false });
    return (data as AppUser[]) || [];
  },

  async createUser(payload: { username: string; nama: string; passwordPlain: string; role: string }): Promise<{ success: boolean; message?: string }> {
    try {
      const hash = await hashPassword(payload.passwordPlain);
      const { error } = await supabase.from("app_users").insert({
        username: payload.username.trim().toLowerCase(),
        nama: payload.nama.trim(),
        password_hash: hash,
        role: payload.role,
        status_aktif: true,
      });

      if (error) {
        if (error.message.includes("unique")) return { success: false, message: "Username/NPP sudah terdaftar." };
        return { success: false, message: error.message };
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  },

  async resetPassword(userId: string, newPasswordPlain: string): Promise<boolean> {
    const hash = await hashPassword(newPasswordPlain);
    const { error } = await supabase
      .from("app_users")
      .update({ password_hash: hash, updated_at: new Date().toISOString() })
      .eq("id", userId);
    return !error;
  },

  async toggleUserStatus(userId: string, currentStatus: boolean): Promise<boolean> {
    const { error } = await supabase
      .from("app_users")
      .update({ status_aktif: !currentStatus, updated_at: new Date().toISOString() })
      .eq("id", userId);
    return !error;
  },

  async updateUser(userId: string, payload: { nama?: string; role?: string; status_aktif?: boolean }): Promise<boolean> {
    const { error } = await supabase
      .from("app_users")
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq("id", userId);
    return !error;
  },

  async deleteUser(userId: string): Promise<boolean> {
    const { error } = await supabase.from("app_users").delete().eq("id", userId);
    return !error;
  },
};
