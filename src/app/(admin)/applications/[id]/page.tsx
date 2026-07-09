import { notFound } from "next/navigation";
import { ApplicationViewer } from "@/components/applications/application-viewer";
import { PageHeader } from "@/components/layout/page-header";
import { applicationRows } from "@/config/mock-data";

export default async function ApplicationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const selected = applicationRows.find((row) => row.id === id);
  if (!selected) notFound();

  const ordered = [selected, ...applicationRows.filter((row) => row.id !== id)];
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
