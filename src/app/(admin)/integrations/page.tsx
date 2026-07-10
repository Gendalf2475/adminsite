import { PageHeader } from "@/components/layout/page-header";
import { IntegrationStatusCard } from "@/components/shared/integration-status-card";
import { prisma } from "@/lib/prisma";
import { buildIntegrationStatuses } from "@/services/view-models";
import { requirePagePermission } from "@/lib/auth";

export default async function IntegrationsPage() {
  await requirePagePermission("integrations.manage");
  const integrationStatuses = buildIntegrationStatuses(
    await prisma.integrationSyncLog.findMany({
      orderBy: { startedAt: "desc" },
      take: 50,
    }),
  );

  return (
    <>
      <PageHeader
        eyebrow="Интеграции"
        title="Контракты внешних систем"
        description="Состояние production-интеграций: Minecraft Plugin API, Google Forms webhook, Telegram и Discord support worker."
      />
      <section className="grid gap-4 xl:grid-cols-2">
        {integrationStatuses.map((integration) => (
          <IntegrationStatusCard key={integration.id} integration={integration} />
        ))}
      </section>
    </>
  );
}
