import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  caption,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  caption: string;
  icon: LucideIcon;
}) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">{title}</p>
          <p className="mt-3 font-display text-3xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{caption}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-majure-soft text-fuchsia-100 ring-1 ring-white/15">
          <Icon size={20} />
        </div>
      </div>
    </div>
  );
}
