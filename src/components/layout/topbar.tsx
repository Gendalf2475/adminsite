"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AuthUser } from "@/types/domain";

export function Topbar({ user }: { user: AuthUser }) {
  const router = useRouter();

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(11,6,20,.72)] backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-5 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Открыть меню">
          <Menu size={18} />
        </Button>
        <div className="hidden min-w-0 flex-1 items-center gap-3 rounded-full border border-white/10 bg-white/[.05] px-4 py-2 text-sm text-[var(--text-faint)] md:flex">
          <Search size={16} />
          Быстрый поиск по персоналу, заявкам и тикетам
        </div>
        <Button variant="ghost" size="icon" aria-label="Уведомления">
          <Bell size={18} />
        </Button>
        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold text-white">{user.displayName}</p>
          <p className="text-xs text-[var(--text-faint)]">@{user.telegramUsername ?? user.telegramId}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Выйти">
          <LogOut size={18} />
        </Button>
      </div>
    </header>
  );
}
