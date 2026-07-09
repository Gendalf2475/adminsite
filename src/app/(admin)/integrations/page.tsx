import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { IntegrationStatusCard } from "@/components/shared/integration-status-card";
import { integrationStatuses } from "@/config/mock-data";

export default function IntegrationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Интеграции"
        title="Контракты внешних систем"
        description="Mock-интеграции готовы к замене на реальные клиенты: Minecraft Plugin API, LuckPerms, Google Sheets, Telegram и Discord."
        actions={
          <Button variant="outline">
            <RefreshCw size={16} />
            Проверить статусы
          </Button>
        }
      />
      <section className="grid gap-4 xl:grid-cols-2">
        {integrationStatuses.map((integration) => (
          <IntegrationStatusCard key={integration.id} integration={integration} />
        ))}
      </section>
    </>
  );
}
