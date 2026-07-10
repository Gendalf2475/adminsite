import { notFound } from "next/navigation";
import { ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/shared/status-badge";
import { StaffCard } from "@/components/staff/staff-card";
import { StaffActions } from "@/components/staff/staff-actions";
import { formatDateTime } from "@/lib/utils";
import { getConfiguredLuckPermsStaffGroups, isLuckPermsIntegrationConfigured } from "@/services/luckperms.service";
import { getStaffMember } from "@/services/staff.service";
import { mapStaffRow } from "@/services/view-models";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staffRecord = await getStaffMember(id);
  if (!staffRecord) notFound();
  const staff = mapStaffRow(staffRecord);
  const luckPermsGroups = getConfiguredLuckPermsStaffGroups();
  const luckPermsReady = isLuckPermsIntegrationConfigured();

  return (
    <>
      <PageHeader
        eyebrow="Карточка сотрудника"
        title={staff.username}
        description="Детальная карточка сотрудника, история изменений и очередь Minecraft-команд для LuckPerms."
        actions={
          <Link href="/staff" className={buttonVariants({ variant: "ghost" })}>
            <ArrowLeft size={16} />
            Назад
          </Link>
        }
      />

      <section className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <StaffCard staff={staff} />
        <Card>
          <CardHeader>
            <CardTitle>Операции и история</CardTitle>
            <StatusBadge value={staff.status} />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">UUID</p>
                <p className="mt-2 break-all text-sm font-bold text-white">{staff.uuid ?? "Не указан"}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Назначил</p>
                <p className="mt-2 text-sm font-bold text-white">{staff.assignedBy}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Discord</p>
                <p className="mt-2 text-sm font-bold text-white">{staff.discordUsername ?? "Не указан"}</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <ShieldCheck size={16} className="text-fuchsia-200" />
                Смена группы через очередь
              </div>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Endpoint `POST /api/staff/{staff.id}/change-group` создает `MinecraftCommandQueue`, а плагин забирает команду через pull-API.
              </p>
            </div>

            <StaffActions staff={staff} luckPermsReady={luckPermsReady} luckPermsGroups={luckPermsGroups} />

            <div className="space-y-3">
              {staffRecord.history.length > 0 ? (
                staffRecord.history.map((event) => (
                  <div key={event.id} className="flex gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-fuchsia-100">
                    <Clock size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{event.action}</p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">Изменение сохранено в истории сотрудника.</p>
                    <p className="mt-1 text-xs text-[var(--text-faint)]">{formatDateTime(event.createdAt.toISOString())}</p>
                  </div>
                </div>
                ))
              ) : (
                <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-[var(--text-muted)]">
                  Истории изменений пока нет.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>
    </>
  );
}
