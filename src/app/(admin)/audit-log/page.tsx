import { PageHeader } from "@/components/layout/page-header";
import { AuditLogTable } from "@/components/shared/audit-log-table";
import { auditRows } from "@/config/mock-data";

export default function AuditLogPage() {
  return (
    <>
      <PageHeader
        eyebrow="Audit"
        title="Audit Log"
        description="Все важные действия backend должен писать с actor, entity, old/new values и metadata. В MVP отображается mock-журнал."
      />
      <AuditLogTable rows={auditRows} />
    </>
  );
}
