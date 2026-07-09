import * as React from "react";
import { cn } from "@/lib/utils";

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "h-10 w-full rounded-full border border-white/15 bg-white/[.07] px-4 text-sm text-white outline-none transition placeholder:text-[var(--text-faint)] focus:border-fuchsia-300/50 focus:ring-4 focus:ring-fuchsia-400/10",
      className,
    )}
    {...props}
  />
));
Input.displayName = "Input";

export { Input };
