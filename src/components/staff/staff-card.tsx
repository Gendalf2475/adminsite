import { CalendarDays, MessageCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/shared/status-badge";
import type { StaffRow } from "@/types/domain";
import { formatDateTime } from "@/lib/utils";

export function StaffCard({ staff }: { staff: StaffRow }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{staff.username}</CardTitle>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{staff.projectPosition}</p>
        </div>
        <StatusBadge value={staff.status} />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm">
          <div className="flex items-center gap-3">
            <Shield size={16} className="text-fuchsia-200" />
            <span className="text-[var(--text-faint)]">LuckPerms</span>
            <span className="ml-auto font-bold text-white">{staff.currentLuckPermsGroup}</span>
          </div>
          <div className="flex items-center gap-3">
            <MessageCircle size={16} className="text-fuchsia-200" />
            <span className="text-[var(--text-faint)]">Telegram</span>
            <span className="ml-auto font-bold text-white">{staff.telegramId ?? "Не привязан"}</span>
          </div>
          <div className="flex items-center gap-3">
            <CalendarDays size={16} className="text-fuchsia-200" />
            <span className="text-[var(--text-faint)]">Назначен</span>
            <span className="ml-auto font-bold text-white">{formatDateTime(staff.assignedAt)}</span>
          </div>
        </div>
        {staff.pendingLuckPermsGroup ? (
          <div className="rounded-2xl border border-amber-300/20 bg-amber-400/10 p-3 text-sm text-amber-100">
            Ожидает выполнения команда смены группы на `{staff.pendingLuckPermsGroup}`.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
