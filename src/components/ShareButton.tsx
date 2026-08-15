import { useState } from "react";
import { Check, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { Title } from "@/data/catalog";
import { cn } from "@/lib/utils";

/** Absolute, shareable URL for a title's details page. */
export function shareUrlFor(t: Title) {
  const base = typeof window === "undefined" ? "" : window.location.origin;
  return `${base}/title/${t.id}`;
}

export function ShareButton({
  title,
  variant = "secondary",
  size,
  className,
  label = "Share",
}: {
  title: Title;
  variant?: "secondary" | "ghost" | "outline" | "default";
  size?: "sm" | "icon";
  className?: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const share = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = shareUrlFor(title);
    const data = {
      title: `${title.title} (${title.year}) — CineAI`,
      text: `${title.title} on CineAI`,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast("Link copied!", { description: url });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // User dismissed the share sheet, or clipboard is blocked.
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        toast("Link copied!", { description: url });
        setTimeout(() => setCopied(false), 2000);
      } catch {
        toast("Couldn't share", { description: url });
      }
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      {...(size ? { size } : {})}
      onClick={share}
      className={cn(className)}
      aria-label={`Share ${title.title}`}
    >
      {copied ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Share2 className="size-4" aria-hidden />
      )}
      {size === "icon" ? null : copied ? "Link copied!" : label}
    </Button>
  );
}
