import { PageHeader } from "@/components/layout/page-header";
import { AuditLogLive } from "@/components/audit/audit-log-live";
import { requirePagePermission } from "@/lib/auth";
import { listAuditLogRows } from "@/services/audit-log.service";

export default async function AuditLogPage() {
  await requirePagePermission("audit.view");
  const rows = await listAuditLogRows();

  return (
    <>
      <PageHeader eyebrow="Безопасность" title="Журнал действий" />
      <AuditLogLive initialRows={rows} />
    </>
  );
}
