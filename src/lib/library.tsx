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
  type FeedbackValue,
  type Preferences,
  type Targets,
  type UserData,
} from "./storage";

export interface ContinueWatchingItem {
  id: string;
  seconds: number;
  runtime: number;
  percent: number;
  updatedAt: string;
}

interface LibraryValue extends UserData {
  /** Plain UserData snapshot for the recommendation engine. */
  snapshot: UserData;
  continueWatching: ContinueWatchingItem[];
  startWatching: (id: string) => void;
  setProgress: (id: string, seconds: number, runtimeMinutes: number) => void;
  stopWatching: (id: string) => void;
  progressOf: (id: string) => ContinueWatchingItem | null;
  setFeedback: (id: string, value: FeedbackValue) => void;
  feedbackOf: (id: string) => FeedbackValue | undefined;
  logWatch: (id: string) => void;
  removeFromHistory: (id: string, date?: string) => void;
  watchCount: (id: string) => number;
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

  const startWatching = useCallback(
    (id: string) =>
      update((d) => {
        const t = byId(id);
        const existing = d.progress[id];
        return {
          ...d,
          progress: {
            ...d.progress,
            [id]: {
              seconds: existing?.seconds ?? 0,
              runtime: t?.runtime ?? existing?.runtime ?? 120,
              updatedAt: new Date().toISOString(),
            },
          },
        };
      }),
    [update],
  );

  const setProgress = useCallback(
    (id: string, seconds: number, runtimeMinutes: number) =>
      update((d) => {
        const total = Math.max(1, runtimeMinutes) * 60;
        const clamped = Math.max(0, Math.min(seconds, total));
        // Completed → move to Watched history and drop from Continue Watching.
        if (clamped / total >= 0.95) {
          const rest = { ...d.progress };
          delete rest[id];
          toast("Finished — added to Watched history ✅", { description: byId(id)?.title });
          return {
            ...d,
            progress: rest,
            watched: [{ id, date: new Date().toISOString() }, ...d.watched],
          };
        }
        return {
          ...d,
          progress: {
            ...d.progress,
            [id]: { seconds: clamped, runtime: runtimeMinutes, updatedAt: new Date().toISOString() },
          },
        };
      }),
    [update],
  );

  const stopWatching = useCallback(
    (id: string) =>
      update((d) => {
        const rest = { ...d.progress };
        delete rest[id];
        return { ...d, progress: rest };
      }),
    [update],
  );

  const setFeedback = useCallback(
    (id: string, value: FeedbackValue) =>
      update((d) => {
        const next = { ...d.feedback };
        if (next[id] === value) delete next[id];
        else next[id] = value;
        toast(
          next[id] === "like"
            ? "More like this 👍"
            : next[id] === "dislike"
              ? "We'll show fewer of these 👎"
              : "Feedback cleared",
          { description: byId(id)?.title },
        );
        return { ...d, feedback: next };
      }),
    [update],
  );

  const logWatch = useCallback(
    (id: string) =>
      update((d) => {
        toast("Added to Watched history ✅", { description: byId(id)?.title });
        const rest = { ...d.progress };
        delete rest[id];
        return {
          ...d,
          progress: rest,
          watched: [{ id, date: new Date().toISOString() }, ...d.watched],
        };
      }),
    [update],
  );

  const removeFromHistory = useCallback(
    (id: string, date?: string) =>
      update((d) => ({
        ...d,
        watched: date
          ? d.watched.filter((w) => !(w.id === id && w.date === date))
          : d.watched.filter((w) => w.id !== id),
      })),
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

  const continueWatching = useMemo<ContinueWatchingItem[]>(
    () =>
      Object.entries(data.progress)
        .map(([id, p]) => ({
          id,
          seconds: p.seconds,
          runtime: p.runtime,
          percent: Math.min(100, Math.round((p.seconds / Math.max(1, p.runtime * 60)) * 100)),
          updatedAt: p.updatedAt,
        }))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [data.progress],
  );

  const value = useMemo<LibraryValue>(
    () => ({
      ...data,
      snapshot: data,
      continueWatching,
      startWatching,
      setProgress,
      stopWatching,
      progressOf: (id) => continueWatching.find((c) => c.id === id) ?? null,
      setFeedback,
      feedbackOf: (id) => data.feedback[id],
      logWatch,
      removeFromHistory,
      watchCount: (id) => data.watched.filter((w) => w.id === id).length,
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
      continueWatching,
      startWatching,
      setProgress,
      stopWatching,
      setFeedback,
      logWatch,
      removeFromHistory,
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
