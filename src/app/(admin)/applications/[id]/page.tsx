import { notFound } from "next/navigation";
import { ApplicationViewer } from "@/components/applications/application-viewer";
import { PageHeader } from "@/components/layout/page-header";
import { getApplication, listApplications } from "@/services/application.service";
import { mapApplicationRow } from "@/services/view-models";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [selectedRecord, applicationRecords] = await Promise.all([getApplication(id), listApplications()]);
  if (!selectedRecord) notFound();

  const selected = mapApplicationRow(selectedRecord);
  const rows = applicationRecords.map(mapApplicationRow);
  const ordered = [selected, ...rows.filter((row) => row.id !== id)];
  return (
    <>
      <PageHeader
        eyebrow="Заявка"
        title={selected.candidateUsername}
        description="Карточка заявки с действиями, статусом и связью с Google Sheets row ID."
      />
      <ApplicationViewer rows={ordered} />
    </>
  );
}
