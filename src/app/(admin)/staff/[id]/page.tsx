import { notFound } from "next/navigation";
import { ArrowLeft, Clock } from "lucide-react";
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
import { getStaffDutyStates } from "@/services/staff-access.service";
import { mapStaffRow } from "@/services/view-models";
import { requirePagePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { canAssignStaffGroup, canManageStaffGroup, isRoleManager } from "@/config/roles";
import { getAuditActionLabel } from "@/config/audit";

export default async function StaffDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePagePermission("staff.view");
  const { id } = await params;
  const staffRecord = await getStaffMember(id);
  if (!staffRecord) notFound();
  const duties = await getStaffDutyStates(id);
  const staff = mapStaffRow(staffRecord, duties);
  const luckPermsGroups = getConfiguredLuckPermsStaffGroups();
  const luckPermsReady = isLuckPermsIntegrationConfigured();
  const editable = hasPermission(user.permissions, "staff.manage") && canManageStaffGroup(user, staff.currentLuckPermsGroup);
  const canEditRank = editable && hasPermission(user.permissions, "staff.change_luckperms_group");
  const availableGroups = Array.from(new Set([
    staff.currentLuckPermsGroup,
    ...luckPermsGroups.filter((group) => canAssignStaffGroup(user, group)),
  ]));

  return (
    <>
      <PageHeader
        eyebrow="Карточка сотрудника"
        title={staff.username}
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
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Назначил</p>
                <p className="mt-2 text-sm font-bold text-white">{staff.assignedBy}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
                <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Discord</p>
                <p className="mt-2 text-sm font-bold text-white">{staff.discordUsername ?? "Не указан"}</p>
              </div>
            </div>

            <StaffActions
              staff={staff}
              luckPermsReady={luckPermsReady}
              luckPermsGroups={availableGroups}
              editable={editable}
              canEditRank={canEditRank}
              canEditDuty={editable && isRoleManager(user)}
            />

            <div className="space-y-3">
              {staffRecord.history.length > 0 ? (
                staffRecord.history.map((event) => {
                  const metadata = event.metadata && typeof event.metadata === "object" && !Array.isArray(event.metadata)
                    ? (event.metadata as Record<string, unknown>)
                    : null;
                  const actor = event.actor?.staffMember?.username ?? event.actor?.telegramUsername ?? event.actor?.displayName ?? "Система";
                  return (
                  <div key={event.id} className="flex gap-3 rounded-lg border border-white/10 bg-white/[.04] p-4">
                  <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/10 text-fuchsia-100">
                    <Clock size={15} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{getAuditActionLabel(event.action, metadata)}</p>
                    <p className="mt-1 text-xs text-[var(--text-faint)]">{actor} · {formatDateTime(event.createdAt.toISOString())}</p>
                  </div>
                </div>
                  );
                })
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
