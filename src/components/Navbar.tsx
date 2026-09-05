import { Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Bookmark,
  Check,
  Clapperboard,
  Compass,
  Film,
  Heart,
  Home,
  LogOut,
  Menu,
  Moon,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Theater,
  User,
} from "lucide-react";
import { useState } from "react";
import { amIAdmin } from "@/lib/admin.functions";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/library";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Home", icon: Home },
  { to: "/movies", label: "Movies", icon: Film },
  { to: "/search", label: "Search", icon: Search },
  { to: "/series", label: "Series", icon: Clapperboard },
  { to: "/watchlist", label: "Watchlist", icon: Bookmark },
  { to: "/favourites", label: "Favourites", icon: Heart },
  { to: "/watched", label: "Watched", icon: Check },
  { to: "/genres", label: "Genres", icon: Theater },
  { to: "/discover", label: "Discover", icon: Compass },
] as const;

const EXTRA = [
  { to: "/requests", label: "Request Movie / Series", icon: Send },
  { to: "/requests", label: "My Requests", icon: Bookmark },
] as const;

const MOBILE = NAV.slice(0, 6);

export function Navbar() {
  const { user, logout } = useAuth();
  const lib = useLibrary();
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const unread = lib.notifications.filter((n) => !n.read).length;

  const initials = (user?.name ?? "CineAI")
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="sticky top-0 z-50 border-b surface-glass">
      <nav className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6">
        <Logo />

        <ul className="ml-4 hidden flex-1 items-center gap-1 xl:flex">
          {NAV.map(({ to, label }) => (
            <li key={to}>
              <Link
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="rounded-full px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1">
          <Button
            asChild
            size="sm"
            className="hidden gap-2 rounded-full bg-cinema text-cinema-foreground hover:bg-cinema/90 sm:inline-flex"
          >
            <Link to="/assistant">
              <Sparkles className="size-4" aria-hidden /> AI Assistant
            </Link>
          </Button>

          <Button size="icon" variant="ghost" asChild aria-label="Search">
            <Link to="/search">
              <Search className="size-4" aria-hidden />
            </Link>
          </Button>

          <Popover>
            <PopoverTrigger asChild>
              <Button size="icon" variant="ghost" className="relative" aria-label="Notifications">
                <Bell className="size-4" aria-hidden />
                {unread > 0 && (
                  <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0">
              <div className="flex items-center justify-between border-b p-3">
                <span className="text-sm font-semibold">Notifications</span>
                <Button variant="ghost" size="sm" onClick={lib.markAllNotificationsRead}>
                  Mark all read
                </Button>
              </div>
              <ul className="max-h-80 overflow-y-auto">
                {lib.notifications.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">You're all caught up.</li>
                )}
                {lib.notifications.map((n) => (
                  <li key={n.id}>
                    <button
                      onClick={() => lib.markNotificationRead(n.id)}
                      className="flex w-full gap-3 border-b p-3 text-left text-sm last:border-0 hover:bg-secondary"
                    >
                      <span
                        className={cn(
                          "mt-1.5 size-2 shrink-0 rounded-full",
                          n.read ? "bg-border" : "bg-primary",
                        )}
                      />
                      <span className="min-w-0">
                        <span className="block">{n.text}</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(n.date).toLocaleDateString()}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </PopoverContent>
          </Popover>

          <Button
            size="icon"
            variant="ghost"
            onClick={toggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? (
              <Sun className="size-4" aria-hidden />
            ) : (
              <Moon className="size-4" aria-hidden />
            )}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2" aria-label="Account menu">
                <span className="grid size-8 place-items-center rounded-full bg-cinema text-xs font-semibold text-cinema-foreground">
                  {initials}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">
                {user?.name}
                <span className="block truncate text-xs font-normal text-muted-foreground">
                  {user?.email}
                </span>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">
                  <User className="size-4" aria-hidden /> Profile & analytics
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/settings">
                  <Settings className="size-4" aria-hidden /> Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={() => {
                  logout();
                  navigate({ to: "/auth" });
                }}
              >
                <LogOut className="size-4" aria-hidden /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button size="icon" variant="ghost" className="xl:hidden" aria-label="Open menu">
                <Menu className="size-4" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <div className="p-4">
                <Logo />
              </div>
              <ul className="space-y-1 px-2">
                {NAV.map(({ to, label, icon: Icon }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      onClick={() => setOpen(false)}
                      activeOptions={{ exact: to === "/" }}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
                    >
                      <Icon className="size-4" aria-hidden /> {label}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link
                    to="/assistant"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium hover:bg-secondary data-[status=active]:bg-accent data-[status=active]:text-accent-foreground"
                  >
                    <Clapperboard className="size-4" aria-hidden /> AI Assistant
                  </Link>
                </li>
              </ul>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Mobile bottom navigation */}
      <ul className="fixed inset-x-0 bottom-0 z-50 grid grid-cols-6 border-t surface-glass px-1 py-1.5 md:hidden">
        {MOBILE.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact: to === "/" }}
              className="flex flex-col items-center gap-0.5 rounded-lg py-1 text-[10px] font-medium text-muted-foreground data-[status=active]:text-primary"
            >
              <Icon className="size-4" aria-hidden />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </header>
  );
}

export function NavBadge({ count }: { count: number }) {
  return <Badge variant="secondary">{count}</Badge>;
}
