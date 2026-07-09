import { Activity, ClipboardList, LifeBuoy, PlugZap, ShieldCheck, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { applicationRows, auditRows, integrationStatuses, staffRows, ticketRows } from "@/config/mock-data";
import { formatDateTime } from "@/lib/utils";

export default function DashboardPage() {
  const activeStaff = staffRows.filter((staff) => staff.status === "ACTIVE").length;
  const newApplications = applicationRows.filter((application) => application.status === "NEW").length;
  const inWorkApplications = applicationRows.filter((application) => ["IN_PROGRESS", "REVIEW"].includes(application.status)).length;
  const openTickets = ticketRows.filter((ticket) => ticket.status !== "CLOSED").length;

  return (
    <>
      <PageHeader
        eyebrow="Операционный центр"
        title="Dashboard"
        description="Сводка по персоналу, заявкам, поддержке и интеграциям MAJURE. Данные сейчас используют mock-сервисы и готовые backend-контракты."
        actions={
          <>
            <Button variant="outline">Синхронизировать</Button>
            <Button variant="primary">Быстрое действие</Button>
          </>
        }
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Активный состав" value={activeStaff} caption="Сотрудники со статусом active" icon={Users} />
        <StatCard title="Новые заявки" value={newApplications} caption="Ожидают первичного разбора" icon={ClipboardList} />
        <StatCard title="Заявки в работе" value={inWorkApplications} caption="Назначены или на рассмотрении" icon={ShieldCheck} />
        <StatCard title="Открытые тикеты" value={openTickets} caption="Telegram и Discord обращения" icon={LifeBuoy} />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Последние действия администрации</CardTitle>
            <Activity className="text-[var(--text-faint)]" size={18} />
          </CardHeader>
          <CardContent className="space-y-3">
            {auditRows.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-white">{row.action}</p>
                  <p className="text-xs text-[var(--text-faint)]">
                    {row.actor} · {row.entityType}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-[var(--text-muted)]">{formatDateTime(row.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Статус интеграций</CardTitle>
            <PlugZap className="text-[var(--text-faint)]" size={18} />
          </CardHeader>
          <CardContent className="space-y-3">
            {integrationStatuses.map((integration) => (
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
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Очередь заявок</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {applicationRows.slice(0, 3).map((application) => (
              <div key={application.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3">
                <div>
                  <p className="font-bold text-white">{application.candidateUsername}</p>
                  <p className="text-xs text-[var(--text-faint)]">{application.googleSheetRowId}</p>
                </div>
                <StatusBadge value={application.status} />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Тикеты поддержки</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ticketRows.slice(0, 3).map((ticket) => (
              <div key={ticket.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[.04] px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate font-bold text-white">{ticket.title}</p>
                  <p className="text-xs text-[var(--text-faint)]">{ticket.source} · {ticket.externalUsername}</p>
                </div>
                <StatusBadge value={ticket.priority} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
