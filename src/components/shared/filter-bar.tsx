"use client";

import { cn } from "@/lib/utils";

export function FilterBar<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ value: T; label: string }>;
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "h-9 rounded-full border px-3 text-xs font-bold transition",
            value === option.value
              ? "border-fuchsia-300/40 bg-fuchsia-400/20 text-white"
              : "border-white/10 bg-white/[.05] text-[var(--text-muted)] hover:bg-white/10 hover:text-white",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
