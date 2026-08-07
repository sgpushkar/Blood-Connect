import { cn } from "../lib/utils";
import { initials } from "../lib/utils";

export function BloodGroupChip({
  group,
  size = "md",
}: {
  group: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "h-7 w-7 text-[11px]",
    md: "h-10 w-10 text-sm",
    lg: "h-14 w-14 text-lg",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-display font-semibold text-white shadow-sm",
        "bg-gradient-to-br from-primary to-primary-dark",
        sizes[size]
      )}
    >
      {group}
    </span>
  );
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-8 w-8 text-xs",
    md: "h-11 w-11 text-sm",
    lg: "h-16 w-16 text-base",
  };
  // deterministic hue from name
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash) % 360;
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold text-white shrink-0",
        sizes[size]
      )}
      style={{ backgroundColor: `hsl(${hue}, 45%, 42%)` }}
    >
      {initials(name)}
    </span>
  );
}

export function BadgePill({ badge }: { badge: string }) {
  const styles: Record<string, string> = {
    Platinum: "bg-slate-800 text-white",
    Gold: "bg-amber-100 text-amber-700",
    Silver: "bg-slate-200 text-slate-700",
    Bronze: "bg-orange-100 text-orange-700",
    New: "bg-card text-ink-soft border border-line",
  };
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-[11px] font-semibold", styles[badge])}>
      {badge}
    </span>
  );
}
