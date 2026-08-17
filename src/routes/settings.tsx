import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/lib/auth";
import { useLibrary } from "@/lib/library";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings | CineAI" },
      {
        name: "description",
        content: "Manage CineAI appearance, notifications, autoplay and stored local data.",
      },
      { property: "og:title", content: "Settings | CineAI" },
      { property: "og:description", content: "Theme, notifications and local data controls." },
    ],
  }),
  component: () => (
    <AppShell>
      <SettingsPage />
    </AppShell>
  ),
});

function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { logout } = useAuth();
  const lib = useLibrary();
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-display text-4xl">Settings</h1>

      <section className="space-y-4 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <Row label="Dark mode" description="Cinematic dark theme, remembered on this device.">
          <Switch checked={theme === "dark"} onCheckedChange={toggle} aria-label="Dark mode" />
        </Row>
        <Row label="Notifications" description="In-app alerts about new picks and your watchlist.">
          <Switch
            checked={lib.preferences.notifications}
            onCheckedChange={(v) => lib.setPreferences({ notifications: v })}
            aria-label="Notifications"
          />
        </Row>
        <Row label="Autoplay trailers" description="Play trailers automatically on details pages.">
          <Switch
            checked={lib.preferences.autoplay}
            onCheckedChange={(v) => lib.setPreferences({ autoplay: v })}
            aria-label="Autoplay"
          />
        </Row>
      </section>

      <section className="space-y-3 rounded-2xl border bg-card p-5 shadow-[var(--shadow-card)]">
        <h2 className="font-semibold">Local data</h2>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => lib.clear("search")}>
            Clear search history
          </Button>
          <Confirm label="Clear favourites" onConfirm={() => lib.clear("favorites")} />
          <Confirm label="Clear watchlist" onConfirm={() => lib.clear("watchlist")} />
          <Confirm label="Clear watched" onConfirm={() => lib.clear("watched")} />
          <Confirm label="Clear all cached data" onConfirm={() => lib.clear("all")} />
        </div>
        <p className="text-xs text-muted-foreground">
          CineAI stores your account and library in this browser only. It is a prototype — replace
          with secure server-side auth and storage before production use.
        </p>
      </section>

      <section className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            void logout().then(() => navigate({ to: "/auth" }));
          }}
        >
          Log out
        </Button>
      </section>
    </div>
  );
}

function Row({
  label,
  description,
  children,
}: {
  label: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <Label className="text-sm font-medium">{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Confirm({
  label,
  onConfirm,
  destructive,
}: {
  label: string;
  onConfirm: () => void;
  destructive?: boolean;
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={destructive ? "destructive" : "outline"} size="sm">
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label}?</AlertDialogTitle>
          <AlertDialogDescription>
            This can't be undone. Your data is stored locally in this browser.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
