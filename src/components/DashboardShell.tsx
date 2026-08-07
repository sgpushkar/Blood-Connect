import type { ReactNode } from "react";
import { Avatar } from "./Chips";
import { cn } from "../lib/utils";

export interface DashboardTab {
  key: string;
  label: string;
  icon: React.ComponentType<{ size?: number }>;
}

export default function DashboardShell({
  title,
  subtitle,
  name,
  roleLabel,
  tabs,
  activeTab,
  onTabChange,
  children,
}: {
  title: string;
  subtitle: string;
  name: string;
  roleLabel: string;
  tabs: DashboardTab[];
  activeTab: string;
  onTabChange: (k: string) => void;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-7xl px-5 py-8 md:px-8">
      <div className="flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={name} size="lg" />
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
              {roleLabel} dashboard
            </p>
            <h1 className="font-display text-2xl font-semibold">{title}</h1>
            <p className="text-sm text-ink-soft">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-8 md:grid-cols-[220px_1fr]">
        <nav className="flex gap-2 overflow-x-auto md:flex-col md:overflow-visible">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => onTabChange(t.key)}
              className={cn(
                "flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                activeTab === t.key
                  ? "bg-status-red-soft text-primary"
                  : "text-ink-soft hover:bg-card"
              )}
            >
              <t.icon size={16} />
              {t.label}
            </button>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: React.ComponentType<{ size?: number }>;
}) {
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-status-red-soft text-primary">
          <Icon size={15} />
        </span>
      </div>
      <p className="mt-3 font-display text-3xl font-semibold">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}
