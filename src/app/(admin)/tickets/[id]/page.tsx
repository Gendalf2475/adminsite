import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TicketChat } from "@/components/tickets/ticket-chat";
import { ticketRows } from "@/config/mock-data";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const selected = ticketRows.find((row) => row.id === id);
  if (!selected) notFound();

  const ordered = [selected, ...ticketRows.filter((row) => row.id !== id)];
  return (
    <>
      <PageHeader eyebrow="Тикет" title={selected.title} description="Диалог игрока и администрации с маршрутизацией ответа в исходный канал." />
      <TicketChat rows={ordered} />
    </>
  );
}
