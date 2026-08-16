/**
 * Authentication backed by Lovable Cloud.
 *
 * The session lives in the auth SDK (secure token storage + automatic refresh),
 * so reopening the site restores the session. Signing out only ends the
 * session — it never deletes account rows or user data.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string | undefined;
  createdAt: string;
}

type Result = { ok: boolean; error?: string };

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (email: string, password: string) => Promise<Result>;
  register: (name: string, email: string, password: string, confirm: string) => Promise<Result>;
  /** Sends a password-reset email that lands on /reset-password. */
  requestPasswordReset: (email: string) => Promise<Result>;
  updateProfile: (patch: Partial<Pick<AuthUser, "name" | "avatar">>) => Promise<void>;
  changePassword: (password: string) => Promise<Result>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const emailValid = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

const fromSession = (session: Session, profile?: { name?: string | null; avatar?: string | null }): AuthUser => ({
  id: session.user.id,
  email: session.user.email ?? "",
  name:
    profile?.name ||
    (session.user.user_metadata?.["name"] as string | undefined) ||
    (session.user.email ?? "there").split("@")[0]!,
  avatar: profile?.avatar ?? (session.user.user_metadata?.["avatar_url"] as string | undefined),
  createdAt: session.user.created_at,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrate = async (session: Session | null) => {
      if (!session) {
        if (active) setUser(null);
        return;
      }
      // Show the session user immediately, then enrich from the profile row.
      if (active) setUser(fromSession(session));
      const { data } = await supabase
        .from("profiles")
        .select("name, avatar")
        .eq("id", session.user.id)
        .maybeSingle();
      if (active) setUser(fromSession(session, data ?? undefined));
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      void hydrate(session);
    });

    void supabase.auth.getSession().then(async ({ data }) => {
      await hydrate(data.session);
      if (active) setReady(true);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback<AuthContextValue["login"]>(async (email, password) => {
    const normalized = email.trim().toLowerCase();
    if (!emailValid(normalized)) return { ok: false, error: "Enter a valid email address." };
    const { error } = await supabase.auth.signInWithPassword({ email: normalized, password });
    if (error) return { ok: false, error: "Incorrect email or password." };
    return { ok: true };
  }, []);

  const register = useCallback<AuthContextValue["register"]>(
    async (name, email, password, confirm) => {
      const normalized = email.trim().toLowerCase();
      if (name.trim().length < 2) return { ok: false, error: "Please enter your full name." };
      if (!emailValid(normalized)) return { ok: false, error: "Enter a valid email address." };
      if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
      if (password !== confirm) return { ok: false, error: "Passwords do not match." };
      const { data, error } = await supabase.auth.signUp({
        email: normalized,
        password,
        options: {
          data: { name: name.trim() },
          emailRedirectTo: typeof window === "undefined" ? undefined : window.location.origin,
        },
      });
      if (error) {
        const msg = /already/i.test(error.message)
          ? "An account with this email already exists — log in instead."
          : error.message;
        return { ok: false, error: msg };
      }
      if (!data.session) {
        return { ok: false, error: "Check your email to confirm your account, then log in." };
      }
      return { ok: true };
    },
    [],
  );

  const requestPasswordReset = useCallback<AuthContextValue["requestPasswordReset"]>(async (email) => {
    const normalized = email.trim().toLowerCase();
    if (!emailValid(normalized)) return { ok: false, error: "Enter a valid email address." };
    const { error } = await supabase.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const updateProfile = useCallback<AuthContextValue["updateProfile"]>(async (patch) => {
    setUser((prev) => (prev ? { ...prev, ...patch } : prev));
    const { data } = await supabase.auth.getUser();
    if (!data.user) return;
    await supabase.from("profiles").update(patch).eq("id", data.user.id);
  }, []);

  const changePassword = useCallback<AuthContextValue["changePassword"]>(async (password) => {
    if (password.length < 6) return { ok: false, error: "Password must be at least 6 characters." };
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    // Ends the session only — every row in the database stays intact.
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, requestPasswordReset, updateProfile, changePassword, logout }),
    [user, ready, login, register, requestPasswordReset, updateProfile, changePassword, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
