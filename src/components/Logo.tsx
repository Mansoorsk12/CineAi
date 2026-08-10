import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <Link
      to="/"
      className={cn("group inline-flex items-center gap-2 animate-cine-rise", className)}
      aria-label="CineAI home"
    >
      <span className="relative grid size-9 shrink-0 place-items-center rounded-xl bg-cinema text-cinema-foreground shadow-[var(--shadow-card)]">
        <span
          aria-hidden
          className="absolute inset-0 rounded-xl opacity-70 transition-opacity group-hover:opacity-100"
          style={{ backgroundImage: "var(--gradient-cinema)" }}
        />
        <svg viewBox="0 0 24 24" className="relative size-5" aria-hidden>
          <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.6" />
          <circle cx="12" cy="12" r="2.4" fill="currentColor" />
          <circle cx="12" cy="6.6" r="1.5" fill="currentColor" opacity="0.9" />
          <circle cx="17" cy="12" r="1.5" fill="currentColor" opacity="0.7" />
          <circle cx="12" cy="17.4" r="1.5" fill="currentColor" opacity="0.55" />
          <circle cx="7" cy="12" r="1.5" fill="currentColor" opacity="0.4" />
        </svg>
      </span>
      {!compact && (
        <span className="font-display text-2xl leading-none">
          Cine<span className="text-primary">AI</span>
        </span>
      )}
    </Link>
  );
}
