import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable, type DataTableColumn } from "@/components/shared/data-table";
import type { AuditLogRow } from "@/types/domain";
import { formatDateTime } from "@/lib/utils";

export function AuditLogTable({ rows }: { rows: AuditLogRow[] }) {
  const columns: Array<DataTableColumn<AuditLogRow>> = [
    { key: "action", header: "Действие", render: (row) => <span className="font-bold text-white">{row.action}</span> },
    { key: "actor", header: "Кто", render: (row) => row.actor },
    { key: "entity", header: "Сущность", render: (row) => `${row.entityType} · ${row.entity}` },
    { key: "created", header: "Когда", render: (row) => formatDateTime(row.createdAt) },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Журнал действий</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable rows={rows} columns={columns} />
      </CardContent>
    </Card>
  );
}
