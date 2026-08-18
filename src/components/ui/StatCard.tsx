import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type Tone = "primary" | "success" | "warning" | "danger" | "info";

const TONES: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info",
};

export function StatCard({
  label,
  value,
  sub,
  delta,
  icon: Icon,
  tone = "primary",
}: {
  label: string;
  value: string;
  sub?: string;
  /** Chip informativo, ej. "+12% vs ayer" o "3 deudores". */
  delta?: ReactNode;
  icon: LucideIcon;
  tone?: Tone;
}) {
  return (
    <div className="group rounded-xl border border-border bg-surface p-4 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-pop">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-muted">{label}</p>
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-transform group-hover:scale-110",
            TONES[tone]
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight text-foreground tabular-nums">{value}</p>
      {(sub || delta) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          {delta && (
            <span className="inline-flex items-center rounded-full bg-surface-2 px-2 py-0.5 text-xs font-semibold text-muted">
              {delta}
            </span>
          )}
          {sub && <p className="text-xs text-muted">{sub}</p>}
        </div>
      )}
    </div>
  );
}
