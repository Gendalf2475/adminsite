"use client";

import Script from "next/script";
import type { Route } from "next";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    onTelegramAuth?: (user: Record<string, unknown>) => void;
  }
}

export function TelegramLoginWidget({ botUsername }: { botUsername?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const next = (nextParam?.startsWith("/") ? nextParam : "/dashboard") as Route;

  const completeLogin = useCallback(
    async (payload: Record<string, unknown>) => {
      const response = await fetch("/api/auth/telegram/callback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        router.push(next);
        router.refresh();
      } else {
        const data = await response.json().catch(() => null);
        alert(data?.error ?? "Telegram login failed");
      }
    },
    [next, router],
  );

  useEffect(() => {
    window.onTelegramAuth = completeLogin;
    return () => {
      delete window.onTelegramAuth;
    };
  }, [completeLogin]);

  async function devLogin() {
    const response = await fetch("/api/auth/dev-login", { method: "POST" });
    if (response.ok) {
      router.push(next);
      router.refresh();
    }
  }

  return (
    <div className="space-y-4">
      {botUsername ? (
        <div className="flex justify-center rounded-2xl border border-white/10 bg-white/[.04] p-4">
          <Script
            src="https://telegram.org/js/telegram-widget.js?22"
            strategy="afterInteractive"
            data-telegram-login={botUsername}
            data-size="large"
            data-userpic="false"
            data-radius="16"
            data-onauth="onTelegramAuth(user)"
          />
        </div>
      ) : (
        <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-4 text-sm text-amber-100">
          <code className="font-mono">NEXT_PUBLIC_TELEGRAM_BOT_USERNAME</code> не задан, Telegram widget скрыт.
        </div>
      )}

      {process.env.NODE_ENV !== "production" ? (
        <Button type="button" variant="outline" className="w-full" onClick={devLogin}>
          Dev-вход Owner
        </Button>
      ) : null}
    </div>
  );
}
