import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "whatsapp";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-primary text-white shadow-sm shadow-primary/30 hover:bg-primary-hover focus-visible:ring-primary/40",
  secondary: "bg-primary-soft text-primary hover:bg-primary/15 focus-visible:ring-primary/40",
  outline:
    "border border-border bg-surface text-foreground shadow-soft hover:bg-surface-2 hover:border-primary/40 focus-visible:ring-primary/30",
  ghost: "text-muted hover:bg-surface-2 hover:text-foreground focus-visible:ring-primary/30",
  danger: "bg-danger text-white hover:bg-danger/90 focus-visible:ring-danger/40",
  whatsapp:
    "bg-whatsapp text-white shadow-sm shadow-whatsapp/30 hover:brightness-95 focus-visible:ring-whatsapp/40",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs rounded-lg gap-1.5",
  md: "h-10 px-4 text-sm rounded-xl gap-2",
  lg: "h-12 px-5 text-base rounded-xl gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", fullWidth, className, children, type, ...rest }, ref) => (
    <button
      ref={ref}
      type={type ?? "button"}
      className={cn(
        "inline-flex select-none items-center justify-center font-medium transition-all",
        "disabled:pointer-events-none disabled:opacity-50",
        "focus-visible:outline-none focus-visible:ring-2 active:scale-[0.97]",
        VARIANTS[variant],
        SIZES[size],
        fullWidth && "w-full",
        className
      )}
      {...rest}
    >
      {children}
    </button>
  )
);
Button.displayName = "Button";
