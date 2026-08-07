import { cn } from "../lib/utils";

interface PulseDividerProps {
  className?: string;
  label?: string;
}

/**
 * A heartbeat / EKG line that draws itself across the section boundary.
 * This is the app's signature visual motif: the "pulse" of the donor
 * network, used everywhere a structural divider is needed.
 */
export default function PulseDivider({ className, label }: PulseDividerProps) {
  return (
    <div className={cn("relative w-full flex items-center gap-4 py-2", className)}>
      <div className="h-px flex-1 bg-line" />
      <svg
        width="180"
        height="28"
        viewBox="0 0 180 28"
        fill="none"
        className="shrink-0 text-primary"
        aria-hidden="true"
      >
        <path
          d="M0 14 H55 L64 4 L74 24 L82 14 L90 20 L96 8 L102 14 H180"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1000}
          className="animate-ekg"
          style={{ strokeDasharray: 1000 }}
        />
      </svg>
      {label ? (
        <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-soft">
          {label}
        </span>
      ) : null}
      <div className="h-px flex-1 bg-line" />
    </div>
  );
}
