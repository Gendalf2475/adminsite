import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export const SelectField = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <div className="relative min-w-0">
      <select
        ref={ref}
        className={cn(
          "h-11 w-full appearance-none rounded-full border border-white/15 bg-white/[.07] px-4 pr-10 text-sm text-white outline-none transition focus:border-fuchsia-300/50 focus:ring-4 focus:ring-fuchsia-400/10 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" size={16} />
    </div>
  ),
);
SelectField.displayName = "SelectField";
