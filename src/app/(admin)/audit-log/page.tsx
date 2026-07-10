import { PageHeader } from "@/components/layout/page-header";
import { AuditLogLive } from "@/components/audit/audit-log-live";
import { prisma } from "@/lib/prisma";
import { mapAuditLogRow } from "@/services/view-models";

export default async function AuditLogPage() {
  const rows = (
    await prisma.auditLog.findMany({
      include: { actor: true },
      orderBy: { createdAt: "desc" },
      take: 100,
    })
  ).map(mapAuditLogRow);

  return (
    <>
      <PageHeader
        eyebrow="Audit"
        title="Audit Log"
        description="Все важные действия backend пишет с actor, entity, old/new values и metadata."
      />
      <AuditLogLive initialRows={rows} />
    </>
  );
}
