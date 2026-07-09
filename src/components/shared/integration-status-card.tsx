import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { IntegrationStatus } from "@/types/domain";
import { formatDateTime } from "@/lib/utils";

const variantByStatus: Record<IntegrationStatus["status"], "success" | "warning" | "danger" | "violet"> = {
  online: "success",
  mock: "violet",
  warning: "warning",
  offline: "danger",
};

export function IntegrationStatusCard({ integration }: { integration: IntegrationStatus }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{integration.name}</CardTitle>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{integration.description}</p>
        </div>
        <Badge variant={variantByStatus[integration.status]}>{integration.status}</Badge>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-2xl border border-white/10 bg-white/[.04] p-4">
          <p className="text-xs font-bold uppercase tracking-[.14em] text-[var(--text-faint)]">Contract</p>
          <p className="mt-2 break-all font-mono text-sm text-white">{integration.contract}</p>
        </div>
        <p className="text-sm text-[var(--text-muted)]">Последняя синхронизация: {formatDateTime(integration.lastSync)}</p>
      </CardContent>
    </Card>
  );
}
