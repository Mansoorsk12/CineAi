/**
 * LocalStorage access layer for CineAI.
 *
 * ⚠️ PROTOTYPE ONLY — this is a browser-only demo "database". Passwords are
 * hashed with a weak, non-cryptographic digest purely so plaintext is not
 * sitting in devtools; this is NOT production-grade security. For production,
 * replace this module with a real backend (Lovable Cloud / Supabase / Firebase)
 * — every consumer only touches the exported functions below, so swapping the
 * implementation does not require touching UI code.
 */

const KEYS = {
  users: "cineai_users",
  currentUser: "cineai_current_user",
  theme: "cineai_theme",
  data: (userId: string) => `cineai_userdata_${userId}`,
} as const;

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string | undefined;
  createdAt: string;
}

export interface Preferences {
  genres: string[];
  languages: string[];
  yearFrom: number;
  yearTo: number;
  notifications: boolean;
  autoplay: boolean;
  uiLanguage: string;
}

export interface Targets {
  movies: number;
  series: number;
  hours: number;
}

export interface WatchedEntry {
  id: string;
  date: string;
}

export interface AppNotification {
  id: string;
  text: string;
  date: string;
  read: boolean;
}

export interface UserData {
  favorites: string[];
  watchlist: string[];
  watched: WatchedEntry[];
  recentlyViewed: string[];
  searchHistory: string[];
  preferences: Preferences;
  targets: Targets;
  notifications: AppNotification[];
}

export const defaultUserData = (): UserData => ({
  favorites: [],
  watchlist: [],
  watched: [],
  recentlyViewed: [],
  searchHistory: [],
  preferences: {
    genres: [],
    languages: [],
    yearFrom: 1980,
    yearTo: new Date().getFullYear(),
    notifications: true,
    autoplay: false,
    uiLanguage: "English",
  },
  targets: { movies: 10, series: 2, hours: 20 },
  notifications: [
    {
      id: "welcome",
      text: "Welcome to CineAI — your AI picks are ready on the home page.",
      date: new Date().toISOString(),
      read: false,
    },
  ],
});

const available = () => {
  try {
    if (typeof window === "undefined") return false;
    window.localStorage.setItem("__cineai_probe", "1");
    window.localStorage.removeItem("__cineai_probe");
    return true;
  } catch {
    return false;
  }
};

export const storageAvailable = available;

function read<T>(key: string, fallback: T): T {
  if (!available()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (!available()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota / private mode — fail silently, UI keeps working in memory */
  }
}

/** Non-cryptographic digest. Demo only — see file header. */
export function weakHash(input: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
}

export const getUsers = () => read<StoredUser[]>(KEYS.users, []);
export const saveUsers = (users: StoredUser[]) => write(KEYS.users, users);

export const getCurrentUserId = () => read<string | null>(KEYS.currentUser, null);
export const setCurrentUserId = (id: string | null) => write(KEYS.currentUser, id);

export const getUserData = (userId: string): UserData => {
  const stored = read<Partial<UserData>>(KEYS.data(userId), {});
  const base = defaultUserData();
  return {
    ...base,
    ...stored,
    preferences: { ...base.preferences, ...(stored.preferences ?? {}) },
    targets: { ...base.targets, ...(stored.targets ?? {}) },
  };
};

export const saveUserData = (userId: string, data: UserData) => write(KEYS.data(userId), data);
export const clearUserData = (userId: string) => {
  if (available()) window.localStorage.removeItem(KEYS.data(userId));
};

export const getTheme = () => read<"light" | "dark">(KEYS.theme, "light");
export const setTheme = (theme: "light" | "dark") => write(KEYS.theme, theme);
