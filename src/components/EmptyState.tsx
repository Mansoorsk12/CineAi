import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export function EmptyState({
  icon,
  title,
  description,
  ctaLabel = "Discover Movies",
  ctaTo = "/movies",
}: {
  icon?: React.ReactNode;
  title: string;
  description: string;
  ctaLabel?: string;
  ctaTo?: "/movies" | "/series" | "/search";
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed bg-secondary/40 px-6 py-16 text-center">
      <div className="mb-4 grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
        {icon}
      </div>
      <h3 className="font-display text-2xl">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      <Button asChild className="mt-6">
        <Link to={ctaTo}>{ctaLabel}</Link>
      </Button>
    </div>
  );
}
