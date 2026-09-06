import { useNavigate } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { useAuth } from "@/lib/auth";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * App shell. By default it is protected: unauthenticated visitors go to /auth.
 * Pass `allowGuests` for public browsing pages (discover, media details).
 */
export function AppShell({ children, allowGuests = false }: { children: ReactNode; allowGuests?: boolean }) {
  const { user, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!allowGuests && ready && !user) navigate({ to: "/auth", replace: true });
  }, [ready, user, navigate, allowGuests]);

  if (!ready || (!user && !allowGuests)) {
    return (
      <div className="mx-auto max-w-5xl space-y-4 p-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full rounded-3xl" />
      </div>
    );
  }


  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 pb-24 pt-8 sm:px-6 md:pb-10">
        <div key={typeof window === "undefined" ? "ssr" : window.location.pathname} className="animate-cine-rise">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
}
