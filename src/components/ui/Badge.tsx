import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "primary";

const STYLES: Record<BadgeVariant, string> = {
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info",
  neutral: "bg-surface-2 text-muted",
  primary: "bg-primary-soft text-primary",
};

export function Badge({
  variant = "neutral",
  dot,
  className,
  children,
}: {
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        STYLES[variant],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
