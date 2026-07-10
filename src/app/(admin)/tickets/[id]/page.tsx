import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { TicketChat } from "@/components/tickets/ticket-chat";
import { getTicket, listTickets } from "@/services/ticket.service";
import { mapTicketRow } from "@/services/view-models";
import { requirePagePermission } from "@/lib/auth";

export default async function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePagePermission("tickets.view");
  const { id } = await params;
  const [selectedRecord, ticketRecords] = await Promise.all([getTicket(id), listTickets()]);
  if (!selectedRecord) notFound();

  const selected = mapTicketRow(selectedRecord);
  const rows = ticketRecords.map(mapTicketRow);
  const ordered = [selected, ...rows.filter((row) => row.id !== id)];
  return (
    <>
      <PageHeader eyebrow="Тикет" title={selected.title} description="Диалог игрока и администрации с маршрутизацией ответа в исходный канал." />
      <TicketChat rows={ordered} />
    </>
  );
}
