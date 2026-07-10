"use client";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Clock, LogOut, Menu, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/shared/status-badge";
import { navItems } from "@/components/layout/nav-items";
import { cn } from "@/lib/utils";
import type { AuthUser } from "@/types/domain";
import type { GlobalSearchResult } from "@/types/domain";
import { hasPermission } from "@/lib/permissions";

const searchTypeLabels: Record<GlobalSearchResult["type"], string> = {
  staff: "Персонал",
  application: "Заявка",
  ticket: "Тикет",
};

export function Topbar({ user }: { user: AuthUser }) {
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchPending, setSearchPending] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const visibleNavItems = navItems.filter((item) => !item.permission || hasPermission(user.permissions, item.permission));

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) {
      setResults([]);
      setSearchPending(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    setSearchPending(true);
    const timeout = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(normalizedQuery)}`, {
          cache: "no-store",
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Search failed");
        const body = (await response.json()) as { data: GlobalSearchResult[] };
        setResults(body.data);
        setSearchError(null);
      } catch (error) {
        if (!controller.signal.aborted) {
          setSearchError("Поиск временно недоступен.");
          setResults([]);
        }
      } finally {
        if (!controller.signal.aborted) setSearchPending(false);
      }
    }, 220);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [query]);

  function openResult(result: GlobalSearchResult) {
    setSearchOpen(false);
    setQuery("");
    setResults([]);
    router.push(result.href as Route);
  }

  function handleSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter" && results[0]) {
      event.preventDefault();
      openResult(results[0]);
    }

    if (event.key === "Escape") {
      setSearchOpen(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-[rgba(11,6,20,.72)] backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-5 lg:px-8">
        <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Открыть меню" onClick={() => setMenuOpen(true)}>
          <Menu size={18} />
        </Button>

        <div ref={searchRef} className="relative hidden min-w-0 flex-1 md:block">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-white/[.05] px-4 py-2 text-sm text-[var(--text-faint)] focus-within:border-fuchsia-300/40 focus-within:ring-4 focus-within:ring-fuchsia-400/10">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Быстрый поиск по персоналу, заявкам и тикетам"
              className="min-w-0 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-[var(--text-faint)]"
            />
          </div>

          {searchOpen ? (
            <div className="absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#130a22]/95 shadow-glass backdrop-blur-xl">
              <div className="max-h-[420px] overflow-y-auto p-2">
                {!query.trim() ? (
                  <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--text-muted)]">
                    <Search size={16} />
                    Введите запрос.
                  </div>
                ) : searchPending ? (
                  <div className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[var(--text-muted)]">
                    <Clock size={16} />
                    Поиск...
                  </div>
                ) : searchError ? (
                  <div className="rounded-2xl px-4 py-3 text-sm text-red-100">{searchError}</div>
                ) : results.length > 0 ? (
                  results.map((result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() => openResult(result)}
                      className="flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition hover:bg-white/[.07]"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-white">{result.title}</p>
                        <p className="mt-1 truncate text-xs text-[var(--text-faint)]">
                          {searchTypeLabels[result.type]} · {result.subtitle}
                        </p>
                      </div>
                      {result.status ? <StatusBadge value={result.status} /> : null}
                    </button>
                  ))
                ) : (
                  <div className="rounded-2xl px-4 py-3 text-sm text-[var(--text-muted)]">Ничего не найдено.</div>
                )}
              </div>
            </div>
          ) : null}
        </div>

        <div className="relative">
          <Button variant="ghost" size="icon" aria-label="Уведомления" onClick={() => setNotificationsOpen((current) => !current)}>
            <Bell size={18} />
          </Button>
          {notificationsOpen ? (
            <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-2xl border border-white/10 bg-[#130a22]/95 p-3 shadow-glass backdrop-blur-xl">
              <p className="text-sm font-bold text-white">Уведомлений нет</p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">Важные действия доступны в журнале.</p>
              {hasPermission(user.permissions, "audit.view") ? (
                <Link
                  href="/audit-log"
                  onClick={() => setNotificationsOpen(false)}
                  className="mt-3 inline-flex h-9 items-center rounded-full border border-white/15 px-3 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  Открыть журнал
                </Link>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="hidden text-right sm:block">
          <p className="text-sm font-bold text-white">{user.displayName}</p>
          <p className="text-xs text-[var(--text-faint)]">@{user.telegramUsername ?? user.telegramId}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Выйти">
          <LogOut size={18} />
        </Button>
      </div>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)} />
          <aside className="glass-panel-strong absolute left-3 top-3 flex max-h-[calc(100vh-24px)] w-[min(320px,calc(100vw-24px))] flex-col rounded-3xl p-4">
            <div className="flex items-center justify-between gap-3">
              <Link href="/dashboard" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-2 py-2">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-majure-gradient font-display text-lg font-extrabold text-white shadow-[0_8px_26px_rgba(217,70,239,.35)]">
                  M
                </span>
                <span>
                  <span className="block font-display text-sm font-bold tracking-[.08em] text-white">MAJURE</span>
                  <span className="block text-xs font-semibold text-[var(--text-faint)]">Admin Control</span>
                </span>
              </Link>
              <Button variant="ghost" size="icon" aria-label="Закрыть меню" onClick={() => setMenuOpen(false)}>
                <X size={18} />
              </Button>
            </div>

            <nav className="mt-4 flex flex-col gap-1 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-bold text-[var(--text-muted)] transition hover:bg-white/[.07] hover:text-white",
                    )}
                  >
                    <Icon size={18} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      ) : null}
    </header>
  );
}
