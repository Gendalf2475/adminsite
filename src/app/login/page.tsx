import { Suspense } from "react";
import { ShieldCheck } from "lucide-react";
import { TelegramLoginWidget } from "@/components/layout/telegram-login-widget";

export default function LoginPage() {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-10">
      <div className="glass-panel-strong w-full max-w-md rounded-3xl p-6">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-majure-gradient text-white shadow-[0_12px_34px_rgba(217,70,239,.4)]">
          <ShieldCheck size={26} />
        </div>
        <div className="mt-5 text-center">
          <p className="text-xs font-extrabold uppercase tracking-[.18em] text-fuchsia-200">MAJURE Admin</p>
          <h1 className="mt-2 font-display text-2xl font-semibold text-white">Вход для администрации</h1>
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            Доступ открывается только сотрудникам с привязанным Telegram ID и активными ролями RBAC.
          </p>
        </div>
        <div className="mt-6">
          <Suspense fallback={<div className="text-center text-sm text-[var(--text-muted)]">Загрузка входа...</div>}>
            <TelegramLoginWidget botUsername={process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
