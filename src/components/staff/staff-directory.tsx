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
import { SelectField } from "@/components/ui/select-field";
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

export function StaffDirectory({
  rows,
  luckPermsReady,
  luckPermsGroups,
  canCreate,
}: {
  rows: StaffRow[];
  luckPermsReady: boolean;
  luckPermsGroups: string[];
  canCreate: boolean;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");
  const [showCreate, setShowCreate] = useState(false);
  const [createPending, setCreatePending] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({
    username: "",
    telegramId: "",
    discordUsername: "",
    currentLuckPermsGroup: luckPermsGroups[0] ?? "",
  });

  const filteredRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return rows.filter((row) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [row.username, row.currentLuckPermsGroup, row.telegramId ?? ""]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesStatus = status === "ALL" ? row.status !== "REMOVED" : row.status === status;
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
          <p className="text-xs text-[var(--text-faint)]">Выдача ранга по нику</p>
        </div>
      ),
    },
    { key: "group", header: "LuckPerms", render: (row) => <span className="font-bold text-white">{row.currentLuckPermsGroup}</span> },
    { key: "status", header: "Статус", render: (row) => <StatusBadge value={row.status} /> },
    { key: "assigned", header: "Назначен", render: (row) => formatDateTime(row.assignedAt) },
  ];

  async function createStaff() {
    if (!luckPermsReady) {
      setCreateError("Добавление будет доступно после подключения LuckPerms.");
      return;
    }
    if (!form.username.trim() || !form.currentLuckPermsGroup.trim()) return;
    setCreatePending(true);
    setCreateError(null);
    const response = await fetch("/api/staff", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: form.username.trim(),
        telegramId: form.telegramId.trim() || undefined,
        discordUsername: form.discordUsername.trim() || undefined,
        currentLuckPermsGroup: form.currentLuckPermsGroup.trim(),
      }),
    });

    if (!response.ok) {
      const result = await response.json().catch(() => null);
      setCreateError(result?.error ?? "Не удалось добавить сотрудника.");
    } else {
      setForm({ username: "", telegramId: "", discordUsername: "", currentLuckPermsGroup: luckPermsGroups[0] ?? "" });
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
          <p className="mt-1 text-sm text-[var(--text-muted)]">Поиск по нику, группе, должности и Telegram ID.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            onClick={() => setShowCreate((current) => !current)}
            disabled={!luckPermsReady || !canCreate}
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
            <Input value={form.telegramId} onChange={(event) => setForm((current) => ({ ...current, telegramId: event.target.value }))} placeholder="Telegram ID" />
            <Input value={form.discordUsername} onChange={(event) => setForm((current) => ({ ...current, discordUsername: event.target.value }))} placeholder="Discord username" />
            <SelectField
              value={form.currentLuckPermsGroup}
              onChange={(event) => setForm((current) => ({ ...current, currentLuckPermsGroup: event.target.value }))}
              disabled={!luckPermsReady}
              aria-label="Ранг"
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
            </SelectField>
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
          <SearchInput value={query} onChange={setQuery} placeholder="Ник, группа, Telegram ID" />
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
