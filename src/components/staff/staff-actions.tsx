"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectField } from "@/components/ui/select-field";
import { STAFF_STATUSES, staffStatusLabels } from "@/config/staff";
import type { StaffRow, StaffStatus } from "@/types/domain";

function resolveInitialGroup(staff: StaffRow, groups: string[]) {
  const pending = staff.pendingLuckPermsGroup ?? "";
  if (groups.includes(pending)) return pending;
  if (groups.includes(staff.currentLuckPermsGroup)) return staff.currentLuckPermsGroup;
  return groups[0] ?? "";
}

export function StaffActions({
  staff,
  luckPermsReady,
  luckPermsGroups,
  editable,
  canEditRank,
  canEditDuty,
}: {
  staff: StaffRow;
  luckPermsReady: boolean;
  luckPermsGroups: string[];
  editable: boolean;
  canEditRank: boolean;
  canEditDuty: boolean;
}) {
  const router = useRouter();
  const [form, setForm] = useState({
    status: staff.status,
    telegramId: staff.telegramId ?? "",
    discordUsername: staff.discordUsername ?? "",
  });
  const [group, setGroup] = useState(resolveInitialGroup(staff, luckPermsGroups));
  const duty = staff.duties[0];
  const [dutyMode, setDutyMode] = useState(duty?.mode ?? "INHERIT");
  const [pending, setPending] = useState<"save" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveDetails() {
    if (!editable) return;
    setPending("save");
    setError(null);
    const response = await fetch(`/api/staff/${staff.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        telegramId: form.telegramId.trim() || null,
        discordUsername: form.discordUsername.trim() || null,
        currentLuckPermsGroup: group,
        dutyMode: canEditDuty ? dutyMode : undefined,
      }),
    });
    await finish(response, "Не удалось сохранить сотрудника.");
    setPending(null);
  }

  async function removeStaff() {
    setPending("remove");
    setError(null);
    const response = await fetch(`/api/staff/${staff.id}/remove`, { method: "POST" });
    await finish(response, "Не удалось снять сотрудника.");
    setPending(null);
  }

  async function finish(response: Response, fallback: string) {
    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setError(result?.error ?? fallback);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4 rounded-lg border border-white/10 bg-white/[.04] p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <SelectField
          value={group}
          onChange={(event) => setGroup(event.target.value)}
          disabled={!editable || !canEditRank || !luckPermsReady}
          aria-label="Ранг"
        >
          {luckPermsGroups.map((option) => (
            <option key={option} value={option} className="bg-[#130d23] text-white">
              {option}
            </option>
          ))}
        </SelectField>
        <SelectField
          value={form.status}
          onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StaffStatus }))}
          disabled={!editable}
          aria-label="Статус"
        >
          {STAFF_STATUSES.map((status) => (
            <option key={status} value={status} className="bg-[#130d23] text-white">
              {staffStatusLabels[status]}
            </option>
          ))}
        </SelectField>
        <Input value={form.telegramId} onChange={(event) => setForm((current) => ({ ...current, telegramId: event.target.value }))} placeholder="Telegram ID" disabled={!editable} />
        <Input value={form.discordUsername} onChange={(event) => setForm((current) => ({ ...current, discordUsername: event.target.value }))} placeholder="Discord username" disabled={!editable} />
      </div>

      {duty ? (
        <div>
          <p className="mb-2 text-xs font-bold uppercase text-[var(--text-faint)]">Допзанятость</p>
          <SelectField value={dutyMode} onChange={(event) => setDutyMode(event.target.value as typeof dutyMode)} disabled={!editable || !canEditDuty} aria-label={duty.name}>
            <option value="INHERIT" className="bg-[#130d23] text-white">По роли ({duty.defaultEnabled ? "включено" : "выключено"})</option>
            <option value="ENABLED" className="bg-[#130d23] text-white">{duty.name}: включено лично</option>
            <option value="DISABLED" className="bg-[#130d23] text-white">{duty.name}: отключено лично</option>
          </SelectField>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="primary" onClick={saveDetails} disabled={pending !== null || !editable || !group.trim()}>
          <Save size={16} />
          {pending === "save" ? "Сохранение..." : "Сохранить"}
        </Button>
        <Button type="button" variant="danger" onClick={removeStaff} disabled={pending !== null || !editable || staff.status === "REMOVED"}>
          <UserX size={16} />
          {pending === "remove" ? "Снятие..." : "Снять"}
        </Button>
      </div>

      {!editable ? <div className="rounded-lg border border-white/10 bg-white/[.04] p-3 text-sm text-[var(--text-muted)]">У вас нет права изменять этого сотрудника.</div> : null}
      {!luckPermsReady ? <div className="rounded-lg border border-white/10 bg-white/[.04] p-3 text-sm text-[var(--text-muted)]">Связь с Minecraft временно недоступна.</div> : null}

      {error ? <div className="rounded-lg border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
    </div>
  );
}
