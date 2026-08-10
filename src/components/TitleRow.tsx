import type { ReactNode } from "react";
import { TitleCard } from "./TitleCard";
import { Skeleton } from "@/components/ui/skeleton";
import type { Title } from "@/data/catalog";

export function Section({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function TitleRow({
  title,
  subtitle,
  items,
  action,
}: {
  title: string;
  subtitle?: string;
  items: Title[];
  action?: ReactNode;
}) {
  if (!items.length) return null;
  return (
    <Section title={title} {...(subtitle ? { subtitle } : {})} {...(action ? { action } : {})}>
      <div className="scroll-row -mx-1 px-1">
        {items.map((t) => (
          <TitleCard
            key={t.id}
            title={t}
            className="scroll-row-item w-[150px] sm:w-[172px] lg:w-[190px]"
          />
        ))}
      </div>
    </Section>
  );
}

export function RowSkeleton() {
  return (
    <div className="scroll-row">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="scroll-row-item w-[150px] space-y-2 sm:w-[172px] lg:w-[190px]">
          <Skeleton className="aspect-[2/3] w-full rounded-2xl" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}
