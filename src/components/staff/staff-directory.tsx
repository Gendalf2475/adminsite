"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import type { StaffRow, StaffStatus } from "@/types/domain";
import { formatDateTime } from "@/lib/utils";

type StatusFilter = "ALL" | StaffStatus;

const filterOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: "ALL", label: "Все" },
  { value: "ACTIVE", label: "Активные" },
  { value: "PROBATION", label: "Испытательный" },
  { value: "VACATION", label: "Отпуск" },
  { value: "REMOVED", label: "Снятые" },
];

const selectClassName =
  "h-10 w-full rounded-full border border-white/15 bg-white/[.07] px-4 text-sm text-white outline-none transition focus:border-fuchsia-300/50 focus:ring-4 focus:ring-fuchsia-400/10";

export function StaffDirectory({ rows, luckPermsReady, luckPermsGroups }: { rows: StaffRow[]; luckPermsReady: boolean; luckPermsGroups: string[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    uuid: "",
    telegramId: "",
    discordUsername: "",
    currentLuckPermsGroup: luckPermsGroups[0] ?? "",
    projectPosition: "",
  });

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [row.username, row.uuid, row.currentLuckPermsGroup, row.projectPosition, row.telegramId ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = status === "ALL" || row.status === status;
      return matchesQuery && matchesStatus;
    });
  }, [query, rows, status]);

  const columns: Array<DataTableColumn<StaffRow>> = [
    {
      key: "username",
      header: "Ник",
      render: (row) => (
        <div>
          <p className="font-bold text-white">{row.username}</p>
          <p className="text-xs text-[var(--text-faint)]">{row.uuid ?? "UUID не указан"}</p>
        </div>
      ),
    },
    { key: "group", header: "LuckPerms", render: (row) => <span className="font-bold text-white">{row.currentLuckPermsGroup}</span> },
    { key: "position", header: "Должность", render: (row) => row.projectPosition },
    { key: "status", header: "Статус", render: (row) => <StatusBadge value={row.status} /> },
    { key: "assigned", header: "Назначен", render: (row) => formatDateTime(row.assignedAt) },
  ];

  async function createStaff() {
    if (!luckPermsReady) {
      setCreateError("Добавление будет доступно после подключения LuckPerms.");
      return;
    }
    if (!form.username.trim() || !form.currentLuckPermsGroup.trim() || !form.projectPosition.trim()) return;
    setCreatePending(true);
    setCreateError(null);
    const response = await fetch("/api/staff", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: form.username.trim(),
        uuid: form.uuid.trim() || undefined,
        telegramId: form.telegramId.trim() || undefined,
        discordUsername: form.discordUsername.trim() || undefined,
        currentLuckPermsGroup: form.currentLuckPermsGroup.trim(),
        projectPosition: form.projectPosition.trim(),
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setCreateError(result?.error ?? "Не удалось добавить сотрудника.");
    } else {
      setForm({ username: "", uuid: "", telegramId: "", discordUsername: "", currentLuckPermsGroup: luckPermsGroups[0] ?? "", projectPosition: "" });
      setShowCreate(false);
      router.refresh();
    }
    setCreatePending(false);
  }

  return (
    <Card>
      <CardHeader className="flex-col items-stretch gap-4 xl:flex-row xl:items-center">
        <div>
          <CardTitle>Состав администрации</CardTitle>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Поиск по нику, UUID, группе, должности и Telegram ID.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => setShowCreate((current) => !current)}
            disabled={!luckPermsReady}
            title={luckPermsReady ? undefined : "Будет доступно после подключения LuckPerms"}
          >
            <Plus size={16} />
            Добавить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!luckPermsReady ? (
          <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4 text-sm text-[var(--text-muted)]">
            Добавление сотрудников будет доступно после подключения LuckPerms.
          </div>
        ) : null}
        {showCreate ? (
          <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[.04] p-4 md:grid-cols-2 xl:grid-cols-3">
            <Input value={form.username} onChange={(event) => setForm((current) => ({ ...current, username: event.target.value }))} placeholder="Ник" />
            <Input value={form.uuid} onChange={(event) => setForm((current) => ({ ...current, uuid: event.target.value }))} placeholder="UUID" />
            <Input value={form.telegramId} onChange={(event) => setForm((current) => ({ ...current, telegramId: event.target.value }))} placeholder="Telegram ID" />
            <Input value={form.discordUsername} onChange={(event) => setForm((current) => ({ ...current, discordUsername: event.target.value }))} placeholder="Discord username" />
            <select
              value={form.currentLuckPermsGroup}
              onChange={(event) => setForm((current) => ({ ...current, currentLuckPermsGroup: event.target.value }))}
              className={selectClassName}
              disabled={!luckPermsReady}
            >
              {luckPermsGroups.length === 0 ? (
                <option value="" className="bg-[#130d23] text-white">
                  Нет настроенных групп
                </option>
              ) : null}
              {luckPermsGroups.map((group) => (
                <option key={group} value={group} className="bg-[#130d23] text-white">
                  {group}
                </option>
              ))}
            </select>
            <Input value={form.projectPosition} onChange={(event) => setForm((current) => ({ ...current, projectPosition: event.target.value }))} placeholder="Должность" />
            {createError ? <p className="text-sm text-red-100 md:col-span-2 xl:col-span-3">{createError}</p> : null}
            <div className="flex gap-2 md:col-span-2 xl:col-span-3">
              <Button type="button" variant="primary" onClick={createStaff} disabled={createPending}>
                {createPending ? "Сохранение..." : "Создать"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)} disabled={createPending}>
                Отмена
              </Button>
            </div>
          </div>
        ) : null}
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
          <SearchInput value={query} onChange={setQuery} placeholder="Ник, UUID, группа, Telegram ID" />
          <FilterBar value={status} options={filterOptions} onChange={setStatus} />
        </div>
        {filteredRows.length > 0 ? (
          <DataTable rows={filteredRows} columns={columns} onRowClick={(row) => router.push(`/staff/${row.id}`)} />
        ) : (
          <EmptyState icon={SearchX} title="Сотрудники не найдены" description="Измените поисковый запрос или сбросьте фильтр статуса." />
        )}
      </CardContent>
    </Card>
  );
}
