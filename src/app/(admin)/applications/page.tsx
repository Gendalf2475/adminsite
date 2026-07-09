import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { ApplicationViewer } from "@/components/applications/application-viewer";
import { applicationRows } from "@/config/mock-data";

export default function ApplicationsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Заявки"
        title="Кандидаты в модерацию"
        description="Split-view для заявок из Google Forms: слева очередь, справа полные ответы, внутренние комментарии и действия обработки."
        actions={
          <Button variant="outline">
            <RefreshCw size={16} />
            Mock sync
          </Button>
        }
      />
      <ApplicationViewer rows={applicationRows} />
    </>
  );
}
