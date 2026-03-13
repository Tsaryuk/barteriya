import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "amber" | "sage" | "coral" | "outline";
}

export function Badge({ className, variant = "default", children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        {
          "bg-warm-100 text-warm-600": variant === "default",
          "bg-brand-amber-light text-brand-amber-dark": variant === "amber",
          "bg-brand-sage-light text-brand-sage": variant === "sage",
          "bg-brand-coral-light text-brand-coral": variant === "coral",
          "border border-warm-200 text-warm-500": variant === "outline",
        },
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
