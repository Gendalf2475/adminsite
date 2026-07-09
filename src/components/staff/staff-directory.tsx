"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, RefreshCw, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import { EmptyState } from "@/components/shared/empty-state";
import { FilterBar } from "@/components/shared/filter-bar";
import { SearchInput } from "@/components/shared/search-input";
import { StatusBadge } from "@/components/shared/status-badge";
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

export function StaffDirectory({ rows }: { rows: StaffRow[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>("ALL");

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
          <p className="text-xs text-[var(--text-faint)]">{row.uuid}</p>
        </div>
      ),
    },
    { key: "group", header: "LuckPerms", render: (row) => <span className="font-bold text-white">{row.currentLuckPermsGroup}</span> },
    { key: "position", header: "Должность", render: (row) => row.projectPosition },
    { key: "status", header: "Статус", render: (row) => <StatusBadge value={row.status} /> },
    { key: "assigned", header: "Назначен", render: (row) => formatDateTime(row.assignedAt) },
  ];

  return (
    <Card>
      <CardHeader className="flex-col items-stretch gap-4 xl:flex-row xl:items-center">
        <div>
          <CardTitle>Состав администрации</CardTitle>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Поиск по нику, UUID, группе, должности и Telegram ID.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline">
            <RefreshCw size={16} />
            Синхронизировать
          </Button>
          <Button variant="primary">
            <Plus size={16} />
            Добавить
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
