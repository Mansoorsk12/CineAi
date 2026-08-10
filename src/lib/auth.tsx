import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  getCurrentUserId,
  getUsers,
  saveUsers,
  setCurrentUserId,
  weakHash,
  type StoredUser,
} from "./storage";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | undefined;
}

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => { ok: boolean; error?: string };
  register: (
    name: string,
    email: string,
    password: string,
    confirm: string,
  ) => { ok: boolean; error?: string };
  resetPassword: (email: string, password: string) => { ok: boolean; error?: string };
  updateProfile: (patch: Partial<Pick<AuthUser, "name" | "avatar">>) => void;
  deleteAccount: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const publicUser = (u: StoredUser): AuthUser => ({
  id: u.id,
  name: u.name,
  email: u.email,
  avatar: u.avatar,
});

const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = getCurrentUserId();
    if (id) {
      const found = getUsers().find((u) => u.id === id);
      if (found) setUser(publicUser(found));
    }
    setReady(true);
  }, []);

  const login = useCallback<AuthContextValue["login"]>((email, password) => {
    const normalized = email.trim().toLowerCase();
    if (!emailValid(normalized)) return { ok: false, error: "Enter a valid email address." };
    const found = getUsers().find((u) => u.email === normalized);
    if (!found || found.passwordHash !== weakHash(password))
      return { ok: false, error: "Incorrect email or password." };
    setCurrentUserId(found.id);
    setUser(publicUser(found));
    return { ok: true };
  }, []);

  const register = useCallback<AuthContextValue["register"]>(
    (name, email, password, confirm) => {
      const normalized = email.trim().toLowerCase();
      if (name.trim().length < 2) return { ok: false, error: "Please enter your full name." };
      if (!emailValid(normalized)) return { ok: false, error: "Enter a valid email address." };
      if (password.length < 6)
        return { ok: false, error: "Password must be at least 6 characters." };
      if (password !== confirm) return { ok: false, error: "Passwords do not match." };
      const users = getUsers();
      if (users.some((u) => u.email === normalized))
        return { ok: false, error: "An account with this email already exists." };
      const created: StoredUser = {
        id: `user_${Date.now().toString(36)}`,
        name: name.trim(),
        email: normalized,
        passwordHash: weakHash(password),
        createdAt: new Date().toISOString(),
      };
      saveUsers([...users, created]);
      setCurrentUserId(created.id);
      setUser(publicUser(created));
      return { ok: true };
    },
    [],
  );

  const resetPassword = useCallback<AuthContextValue["resetPassword"]>((email, password) => {
    const normalized = email.trim().toLowerCase();
    const users = getUsers();
    const existing = users.find((u) => u.email === normalized);
    if (!existing) return { ok: false, error: "No account found with that email." };
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    existing.passwordHash = weakHash(password);
    saveUsers(users);
    return { ok: true };
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>((patch) => {
    setUser((prev) => {
      if (!prev) return prev;
      const users = getUsers().map((u) => (u.id === prev.id ? { ...u, ...patch } : u));
      saveUsers(users);
      return { ...prev, ...patch };
    });
  }, []);

  const logout = useCallback(() => {
    setCurrentUserId(null);
    setUser(null);
  }, []);

  const deleteAccount = useCallback(() => {
    setUser((prev) => {
      if (prev) saveUsers(getUsers().filter((u) => u.id !== prev.id));
      setCurrentUserId(null);
      return null;
    });
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, resetPassword, updateProfile, logout, deleteAccount }),
    [user, ready, login, register, resetPassword, updateProfile, logout, deleteAccount],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
