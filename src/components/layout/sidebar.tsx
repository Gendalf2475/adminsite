"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { navItems } from "@/components/layout/nav-items";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="glass-panel fixed left-5 top-5 z-30 hidden h-[calc(100vh-40px)] w-[264px] flex-col rounded-3xl p-4 lg:flex">
      <Link href="/dashboard" className="flex items-center gap-3 px-2 py-2">
        <span className="grid h-10 w-10 place-items-center rounded-2xl bg-majure-gradient font-display text-lg font-extrabold text-white shadow-[0_8px_26px_rgba(217,70,239,.35)]">
          M
        </span>
        <span>
          <span className="block font-display text-sm font-bold tracking-[.08em] text-white">
            MAJURE
          </span>
          <span className="block text-xs font-semibold text-[var(--text-faint)]">Admin Control</span>
        </span>
      </Link>

      <nav className="mt-6 flex flex-1 flex-col gap-1">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/settings" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold transition",
                active
                  ? "bg-white/12 text-white shadow-[inset_0_1px_0_rgba(255,255,255,.18)]"
                  : "text-[var(--text-muted)] hover:bg-white/[.07] hover:text-white",
              )}
            >
              <Icon size={18} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.12em] text-emerald-200">
          <Activity size={14} />
          plugin sync
        </div>
        <p className="mt-2 text-xs text-[var(--text-muted)]">Production-контракты активны, очередь команд готова.</p>
      </div>
    </aside>
  );
}
