import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export function Card({
  className,
  hover,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { hover?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface shadow-card transition-all",
        hover && "hover:-translate-y-0.5 hover:shadow-pop",
        className
      )}
      {...rest}
    />
  );
}
