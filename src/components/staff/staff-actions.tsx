"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, ShieldCheck, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { StaffRow, StaffStatus } from "@/types/domain";

const statuses: StaffStatus[] = ["ACTIVE", "PROBATION", "VACATION", "REMOVED"];
const selectClassName =
  "h-10 w-full rounded-full border border-white/15 bg-white/[.07] px-4 text-sm text-white outline-none transition focus:border-fuchsia-300/50 focus:ring-4 focus:ring-fuchsia-400/10";

function resolveInitialGroup(staff: StaffRow, groups: string[]) {
  const pending = staff.pendingLuckPermsGroup ?? "";
  if (groups.includes(pending)) return pending;
  if (groups.includes(staff.currentLuckPermsGroup)) return staff.currentLuckPermsGroup;
  return groups[0] ?? "";
}

export function StaffActions({ staff, luckPermsReady, luckPermsGroups }: { staff: StaffRow; luckPermsReady: boolean; luckPermsGroups: string[] }) {
  const router = useRouter();
  const [form, setForm] = useState({
    projectPosition: staff.projectPosition,
    status: staff.status,
    telegramId: staff.telegramId ?? "",
    discordUsername: staff.discordUsername ?? "",
    notes: staff.notes ?? "",
  });
  const [group, setGroup] = useState(resolveInitialGroup(staff, luckPermsGroups));
  const [pending, setPending] = useState<"save" | "group" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function saveDetails() {
    setPending("save");
    setError(null);
    const response = await fetch(`/api/staff/${staff.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectPosition: form.projectPosition.trim(),
        status: form.status,
        telegramId: form.telegramId.trim() || null,
        discordUsername: form.discordUsername.trim() || null,
        notes: form.notes.trim(),
      }),
    });
    await finish(response, "Не удалось сохранить сотрудника.");
    setPending(null);
  }

  async function changeGroup() {
    if (!luckPermsReady) {
      setError("Смена группы будет доступна после подключения LuckPerms.");
      return;
    }
    const nextGroup = group.trim();
    if (!nextGroup) return;
    setPending("group");
    setError(null);
    const response = await fetch(`/api/staff/${staff.id}/change-group`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ group: nextGroup }),
    });
    await finish(response, "Не удалось поставить команду LuckPerms в очередь.");
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
    <div className="space-y-4 rounded-2xl border border-white/10 bg-white/[.04] p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Input value={form.projectPosition} onChange={(event) => setForm((current) => ({ ...current, projectPosition: event.target.value }))} placeholder="Должность" />
        <select
          value={form.status}
          onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StaffStatus }))}
          className={selectClassName}
        >
          {statuses.map((status) => (
            <option key={status} value={status} className="bg-[#130d23] text-white">
              {status}
            </option>
          ))}
        </select>
        <Input value={form.telegramId} onChange={(event) => setForm((current) => ({ ...current, telegramId: event.target.value }))} placeholder="Telegram ID" />
        <Input value={form.discordUsername} onChange={(event) => setForm((current) => ({ ...current, discordUsername: event.target.value }))} placeholder="Discord username" />
        <Input value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} placeholder="Заметки" />
        <Button type="button" variant="primary" onClick={saveDetails} disabled={pending !== null}>
          <Save size={16} />
          {pending === "save" ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <select value={group} onChange={(event) => setGroup(event.target.value)} className={selectClassName} disabled={!luckPermsReady}>
          {luckPermsGroups.length === 0 ? (
            <option value="" className="bg-[#130d23] text-white">
              Нет настроенных групп
            </option>
          ) : null}
          {luckPermsGroups.map((option) => (
            <option key={option} value={option} className="bg-[#130d23] text-white">
              {option}
            </option>
          ))}
        </select>
        <Button
          type="button"
          variant="outline"
          onClick={changeGroup}
          disabled={pending !== null || !group.trim() || !luckPermsReady}
          title={luckPermsReady ? undefined : "Будет доступно после подключения LuckPerms"}
        >
          <ShieldCheck size={16} />
          {pending === "group" ? "Очередь..." : "Сменить группу"}
        </Button>
        <Button type="button" variant="danger" onClick={removeStaff} disabled={pending !== null || staff.status === "REMOVED"}>
          <UserX size={16} />
          {pending === "remove" ? "Снятие..." : "Снять"}
        </Button>
      </div>

      {!luckPermsReady ? (
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-3 text-sm text-[var(--text-muted)]">
          Смена LuckPerms-группы будет доступна после подключения Minecraft-плагина.
        </div>
      ) : null}

      {error ? <div className="rounded-2xl border border-red-300/20 bg-red-500/10 p-3 text-sm text-red-100">{error}</div> : null}
    </div>
  );
}
