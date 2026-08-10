import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import { useAuth } from "./auth";
import { byId, type Title } from "@/data/catalog";
import {
  clearUserData,
  defaultUserData,
  getUserData,
  saveUserData,
  type AppNotification,
  type Preferences,
  type Targets,
  type UserData,
} from "./storage";

interface LibraryValue extends UserData {
  toggleFavorite: (id: string) => void;
  toggleWatchlist: (id: string) => void;
  toggleWatched: (id: string) => void;
  markViewed: (id: string) => void;
  addSearch: (q: string) => void;
  setPreferences: (p: Partial<Preferences>) => void;
  setTargets: (t: Partial<Targets>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clear: (what: "search" | "favorites" | "watchlist" | "watched" | "all") => void;
  isFavorite: (id: string) => boolean;
  inWatchlist: (id: string) => boolean;
  isWatched: (id: string) => boolean;
}

const LibraryContext = createContext<LibraryValue | null>(null);

export function LibraryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [data, setData] = useState<UserData>(defaultUserData);
  const loadedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      loadedFor.current = null;
      setData(defaultUserData());
      return;
    }
    loadedFor.current = user.id;
    setData(getUserData(user.id));
  }, [user]);

  // Persist on every change, scoped to the signed-in user.
  useEffect(() => {
    if (user && loadedFor.current === user.id) saveUserData(user.id, data);
  }, [user, data]);

  const update = useCallback((fn: (d: UserData) => UserData) => setData(fn), []);

  const toggleFavorite = useCallback(
    (id: string) =>
      update((d) => {
        const on = d.favorites.includes(id);
        toast(on ? "Removed from Favourites" : "Added to Favourites ❤️", {
          description: byId(id)?.title,
        });
        return { ...d, favorites: on ? d.favorites.filter((x) => x !== id) : [id, ...d.favorites] };
      }),
    [update],
  );

  const toggleWatchlist = useCallback(
    (id: string) =>
      update((d) => {
        const on = d.watchlist.includes(id);
        toast(on ? "Removed from Watchlist" : "Added to Watchlist 📋", {
          description: byId(id)?.title,
        });
        return { ...d, watchlist: on ? d.watchlist.filter((x) => x !== id) : [id, ...d.watchlist] };
      }),
    [update],
  );

  const toggleWatched = useCallback(
    (id: string) =>
      update((d) => {
        const on = d.watched.some((w) => w.id === id);
        toast(on ? "Removed from Watched" : "Marked as watched ✅", {
          description: byId(id)?.title,
        });
        return {
          ...d,
          watched: on
            ? d.watched.filter((w) => w.id !== id)
            : [{ id, date: new Date().toISOString() }, ...d.watched],
        };
      }),
    [update],
  );

  const markViewed = useCallback(
    (id: string) =>
      update((d) => ({
        ...d,
        recentlyViewed: [id, ...d.recentlyViewed.filter((x) => x !== id)].slice(0, 20),
      })),
    [update],
  );

  const addSearch = useCallback(
    (q: string) =>
      update((d) =>
        q.trim().length < 2
          ? d
          : {
              ...d,
              searchHistory: [q.trim(), ...d.searchHistory.filter((x) => x !== q.trim())].slice(
                0,
                20,
              ),
            },
      ),
    [update],
  );

  const setPreferences = useCallback(
    (p: Partial<Preferences>) =>
      update((d) => ({ ...d, preferences: { ...d.preferences, ...p } })),
    [update],
  );

  const setTargets = useCallback(
    (t: Partial<Targets>) => update((d) => ({ ...d, targets: { ...d.targets, ...t } })),
    [update],
  );

  const markNotificationRead = useCallback(
    (id: string) =>
      update((d) => ({
        ...d,
        notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
      })),
    [update],
  );

  const markAllNotificationsRead = useCallback(
    () =>
      update((d) => ({ ...d, notifications: d.notifications.map((n) => ({ ...n, read: true })) })),
    [update],
  );

  const clear = useCallback<LibraryValue["clear"]>(
    (what) => {
      if (what === "all") {
        if (user) clearUserData(user.id);
        setData(defaultUserData());
        toast("All local data cleared");
        return;
      }
      update((d) => {
        const next = { ...d };
        if (what === "search") next.searchHistory = [];
        if (what === "favorites") next.favorites = [];
        if (what === "watchlist") next.watchlist = [];
        if (what === "watched") next.watched = [];
        return next;
      });
      toast("Cleared");
    },
    [update, user],
  );

  // Derived notifications kept fresh without duplicating user actions.
  useEffect(() => {
    const unwatched = data.watchlist.length;
    if (unwatched >= 3) {
      setData((d) =>
        d.notifications.some((n) => n.id === "watchlist-reminder")
          ? d
          : {
              ...d,
              notifications: [
                {
                  id: "watchlist-reminder",
                  text: `You have ${unwatched} titles waiting in your Watchlist.`,
                  date: new Date().toISOString(),
                  read: false,
                },
                ...d.notifications,
              ],
            },
      );
    }
  }, [data.watchlist.length]);

  const value = useMemo<LibraryValue>(
    () => ({
      ...data,
      toggleFavorite,
      toggleWatchlist,
      toggleWatched,
      markViewed,
      addSearch,
      setPreferences,
      setTargets,
      markNotificationRead,
      markAllNotificationsRead,
      clear,
      isFavorite: (id) => data.favorites.includes(id),
      inWatchlist: (id) => data.watchlist.includes(id),
      isWatched: (id) => data.watched.some((w) => w.id === id),
    }),
    [
      data,
      toggleFavorite,
      toggleWatchlist,
      toggleWatched,
      markViewed,
      addSearch,
      setPreferences,
      setTargets,
      markNotificationRead,
      markAllNotificationsRead,
      clear,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary() {
  const ctx = useContext(LibraryContext);
  if (!ctx) throw new Error("useLibrary must be used inside LibraryProvider");
  return ctx;
}

export type { AppNotification, Title };
