"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { Activity, ClipboardList, LifeBuoy, PlugZap, ShieldCheck, Users, type LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { formatDateTime } from "@/lib/utils";
import type { DashboardSummary } from "@/types/domain";

export function DashboardLive({ initialSummary }: { initialSummary: DashboardSummary }) {
  const [summary, setSummary] = useState(initialSummary);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function refresh() {
      try {
        const response = await fetch("/api/dashboard/summary", { cache: "no-store" });
        if (!response.ok) throw new Error("Dashboard refresh failed");
        const result = (await response.json()) as { data: DashboardSummary };
        if (mounted) {
          setSummary(result.data);
          setError(null);
        }
      } catch {
        if (mounted) setError("Не удалось обновить dashboard.");
      }
    }

    const interval = window.setInterval(refresh, 5000);
    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const metricCards: Array<{
    href: Route;
    title: string;
    value: number;
    caption: string;
    icon: LucideIcon;
    visible: boolean;
  }> = [
    {
      href: "/staff",
      title: "Активный состав",
      value: summary.metrics.activeStaff,
      caption: "Сотрудники со статусом active",
      icon: Users,
      visible: summary.visibility.staff,
    },
    {
      href: "/applications",
      title: "Новые заявки",
      value: summary.metrics.newApplications,
      caption: "Ожидают первичного разбора",
      icon: ClipboardList,
      visible: summary.visibility.applications,
    },
    {
      href: "/applications",
      title: "Заявки в работе",
      value: summary.metrics.inWorkApplications,
      caption: "Назначены или на рассмотрении",
      icon: ShieldCheck,
      visible: summary.visibility.applications,
    },
    {
      href: "/tickets",
      title: "Открытые тикеты",
      value: summary.metrics.openTickets,
      caption: "Telegram и Discord обращения",
      icon: LifeBuoy,
      visible: summary.visibility.tickets,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Операционный центр"
        title="Dashboard"
        description="Сводка по персоналу, заявкам, поддержке и интеграциям MAJURE из production-БД."
      />

      <div className="flex flex-wrap items-center gap-3 text-xs text-[var(--text-faint)]">
        <span>Обновлено: {formatDateTime(summary.generatedAt)}</span>
        {error ? <span className="text-red-100">{error}</span> : null}
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {metricCards.filter((card) => card.visible).map((card) => (
          <Link key={card.title} href={card.href} className="block rounded-2xl transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-300/70">
            <StatCard title={card.title} value={card.value} caption={card.caption} icon={card.icon} />
          </Link>
        ))}
      </section>

      {summary.visibility.audit || summary.visibility.integrations ? <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        {summary.visibility.audit ? (
        <Card>
          <CardHeader>
            <CardTitle>Последние действия администрации</CardTitle>
            <Activity className="text-[var(--text-faint)]" size={18} />
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.auditRows.length > 0 ? (
              summary.auditRows.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{row.action}</p>
                    <p className="text-xs text-[var(--text-faint)]">
                      {row.actor} · {row.entityType} · {row.entity}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs text-[var(--text-muted)]">{formatDateTime(row.createdAt)}</p>
                </div>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-[var(--text-muted)]">Действий пока нет.</p>
            )}
          </CardContent>
        </Card>
        ) : null}

        {summary.visibility.integrations ? (
        <Card>
          <CardHeader>
            <CardTitle>Статус интеграций</CardTitle>
            <PlugZap className="text-[var(--text-faint)]" size={18} />
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.integrationStatuses.map((integration) => (
              <div key={integration.id} className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{integration.name}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{integration.contract}</p>
                  </div>
                  <span className="rounded-full border border-fuchsia-300/20 bg-fuchsia-400/15 px-2.5 py-1 text-xs font-bold text-fuchsia-100">
                    {integration.status}
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        ) : null}
      </section> : null}

      {summary.visibility.applications || summary.visibility.tickets ? <section className="grid gap-4 xl:grid-cols-2">
        {summary.visibility.applications ? (
        <Card>
          <CardHeader>
            <CardTitle>Очередь заявок</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.applicationRows.length > 0 ? (
              summary.applicationRows.map((application) => (
                <Link key={application.id} href={`/applications/${application.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 transition hover:bg-white/[.07]">
                  <div>
                    <p className="font-bold text-white">{application.candidateUsername}</p>
                    <p className="text-xs text-[var(--text-faint)]">{application.googleSheetRowId ?? "Google row не указан"}</p>
                  </div>
                  <StatusBadge value={application.status} />
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-[var(--text-muted)]">Заявок пока нет.</p>
            )}
          </CardContent>
        </Card>
        ) : null}
        {summary.visibility.tickets ? (
        <Card>
          <CardHeader>
            <CardTitle>Тикеты поддержки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {summary.ticketRows.length > 0 ? (
              summary.ticketRows.map((ticket) => (
                <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3 transition hover:bg-white/[.07]">
                  <div className="min-w-0">
                    <p className="truncate font-bold text-white">{ticket.title}</p>
                    <p className="text-xs text-[var(--text-faint)]">
                      {ticket.source} · {ticket.externalUsername}
                    </p>
                  </div>
                  <StatusBadge value={ticket.priority} />
                </Link>
              ))
            ) : (
              <p className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-[var(--text-muted)]">Тикетов пока нет.</p>
            )}
          </CardContent>
        </Card>
        ) : null}
      </section> : null}
    </>
  );
}
