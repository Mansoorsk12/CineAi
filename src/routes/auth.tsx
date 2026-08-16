import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to CineAI — AI Movie & Series Discovery" },
      {
        name: "description",
        content:
          "Create your CineAI account to get AI-personalised movie and series recommendations, watchlists and viewing analytics.",
      },
      { property: "og:title", content: "Sign in to CineAI" },
      {
        property: "og:description",
        content: "AI-personalised movie and series recommendations, watchlists and analytics.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { user, ready, login, register, requestPasswordReset } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState("login");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/", replace: true });
  }, [ready, user, navigate]);

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden cinema-panel lg:block">
        <div
          className="absolute inset-0 animate-cine-zoom opacity-45"
          style={{
            backgroundImage:
              "radial-gradient(80% 60% at 20% 15%, oklch(0.55 0.21 25 / 0.45), transparent 60%), radial-gradient(70% 70% at 90% 90%, oklch(0.7 0.1 250 / 0.28), transparent 65%)",
          }}
          aria-hidden
        />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo />
          <div className="max-w-md space-y-4">
            <h1 className="font-display text-6xl leading-[0.95]">
              Every great night in starts with the right pick.
            </h1>
            <p className="text-cinema-foreground/75">
              CineAI learns from what you love — across Telugu, Indian and world cinema — and turns
              it into recommendations you'll actually watch.
            </p>
          </div>
          <p className="text-xs text-cinema-foreground/50">
            Your watch history, favourites and progress are saved to your account.
          </p>
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm animate-cine-rise">
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>
          <Tabs
            value={mode}
            onValueChange={(v) => {
              setMode(v);
              setError(null);
            }}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="login">Log in</TabsTrigger>
              <TabsTrigger value="register">Sign up</TabsTrigger>
              <TabsTrigger value="forgot">Forgot</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-6">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  setBusy(true);
                  const res = await login(String(f.get("email")), String(f.get("password")));
                  setBusy(false);
                  if (!res.ok) return setError(res.error ?? "Login failed.");
                  setError(null);
                  toast("Welcome back to CineAI 🎬", { description: "Restoring your library…" });
                  navigate({ to: "/" });
                }}
              >
                <Field id="login-email" label="Email" name="email" type="email" />
                <Field id="login-password" label="Password" name="password" type="password" />
                {error && <ErrorText>{error}</ErrorText>}
                <Button type="submit" className="w-full" disabled={busy}>
                  Log in
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register" className="mt-6">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  setBusy(true);
                  const res = await register(
                    String(f.get("name")),
                    String(f.get("email")),
                    String(f.get("password")),
                    String(f.get("confirm")),
                  );
                  setBusy(false);
                  if (!res.ok) return setError(res.error ?? "Registration failed.");
                  setError(null);
                  toast("Account created — welcome to CineAI ✨");
                  navigate({ to: "/" });
                }}
              >
                <Field id="reg-name" label="Full name" name="name" />
                <Field id="reg-email" label="Email" name="email" type="email" />
                <Field id="reg-password" label="Password" name="password" type="password" />
                <Field id="reg-confirm" label="Confirm password" name="confirm" type="password" />
                {error && <ErrorText>{error}</ErrorText>}
                <Button type="submit" className="w-full" disabled={busy}>
                  Create account
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="forgot" className="mt-6">
              <form
                className="space-y-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const f = new FormData(e.currentTarget);
                  setBusy(true);
                  const res = await requestPasswordReset(String(f.get("email")));
                  setBusy(false);
                  if (!res.ok) return setError(res.error ?? "Could not send the reset email.");
                  setError(null);
                  toast("Password reset email sent 📧", {
                    description: "Open the link to choose a new password.",
                  });
                  setMode("login");
                }}
              >
                <p className="text-sm text-muted-foreground">
                  We'll email you a secure link to set a new password.
                </p>
                <Field id="fp-email" label="Account email" name="email" type="email" />
                {error && <ErrorText>{error}</ErrorText>}
                <Button type="submit" className="w-full" disabled={busy}>
                  Send reset link
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Already have an account? Just log in — your watch history, favourites and progress are
            restored automatically. You can also{" "}
            <button
              type="button"
              className="underline underline-offset-2"
              onClick={() => navigate({ to: "/" })}
            >
              browse as a guest
            </button>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

function Field({
  id,
  label,
  name,
  type = "text",
}: {
  id: string;
  label: string;
  name: string;
  type?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type={type} required autoComplete="on" />
    </div>
  );
}

function ErrorText({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-lg bg-accent px-3 py-2 text-sm text-accent-foreground">
      {children}
    </p>
  );
}
