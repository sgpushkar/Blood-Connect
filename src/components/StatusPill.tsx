import { cn } from "../lib/utils";

type Tone = "green" | "orange" | "red" | "neutral";

const TONE_MAP: Record<Tone, string> = {
  green: "bg-status-green-soft text-status-green",
  orange: "bg-status-orange-soft text-status-orange",
  red: "bg-status-red-soft text-status-red",
  neutral: "bg-card text-ink-soft border border-line",
};

export function toneForUrgency(u: string): Tone {
  if (u === "Critical") return "red";
  if (u === "Urgent") return "orange";
  return "neutral";
}

export function toneForRequestStatus(s: string): Tone {
  if (s === "Fulfilled") return "green";
  if (s === "Matched") return "orange";
  if (s === "Cancelled") return "neutral";
  return "red";
}

export default function StatusPill({
  tone,
  children,
  dot = false,
}: {
  tone: Tone;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
        TONE_MAP[tone]
      )}
    >
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          <span
            className={cn(
              "absolute inline-flex h-full w-full rounded-full opacity-75 animate-pulse-ring",
              tone === "green" && "bg-status-green",
              tone === "orange" && "bg-status-orange",
              tone === "red" && "bg-status-red",
              tone === "neutral" && "bg-ink-soft"
            )}
          />
          <span
            className={cn(
              "relative inline-flex h-1.5 w-1.5 rounded-full",
              tone === "green" && "bg-status-green",
              tone === "orange" && "bg-status-orange",
              tone === "red" && "bg-status-red",
              tone === "neutral" && "bg-ink-soft"
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}
