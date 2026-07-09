import { PageHeader } from "@/components/layout/page-header";
import { ApplicationViewer } from "@/components/applications/application-viewer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { getLatestGoogleFormsSyncLog } from "@/services/google-forms.service";
import { listApplications } from "@/services/application.service";
import { mapApplicationRow } from "@/services/view-models";

export default async function ApplicationsPage() {
  const [applications, latestSync] = await Promise.all([listApplications(), getLatestGoogleFormsSyncLog()]);
  const rows = applications.map(mapApplicationRow);
  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/api/integrations/google-forms/webhook`;

  return (
    <>
      <PageHeader
        eyebrow="Заявки"
        title="Кандидаты в модерацию"
        description="Split-view для заявок из Google Forms: слева очередь, справа полные ответы, внутренние комментарии и действия обработки."
      />
      <Card>
        <CardHeader>
          <CardTitle>Google Forms Webhook</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm text-[var(--text-muted)] md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="font-mono text-white">{webhookUrl || "/api/integrations/google-forms/webhook"}</p>
            <p className="mt-1">Apps Script должен отправлять POST с Bearer token из GOOGLE_FORMS_WEBHOOK_SECRET.</p>
          </div>
          <p className="text-xs text-[var(--text-faint)]">
            Последний sync: {latestSync ? `${latestSync.status} · ${formatDateTime((latestSync.finishedAt ?? latestSync.startedAt).toISOString())}` : "не было"}
          </p>
        </CardContent>
      </Card>
      <ApplicationViewer rows={rows} />
    </>
  );
}
