import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold leading-none",
  {
    variants: {
      variant: {
        default: "border-white/15 bg-white/10 text-white",
        muted: "border-white/10 bg-white/[.06] text-[var(--text-muted)]",
        success: "border-emerald-300/25 bg-emerald-400/15 text-emerald-100",
        warning: "border-amber-300/25 bg-amber-400/15 text-amber-100",
        danger: "border-red-300/25 bg-red-400/15 text-red-100",
        violet: "border-fuchsia-300/25 bg-fuchsia-400/15 text-fuchsia-100",
        info: "border-sky-300/25 bg-sky-400/15 text-sky-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
