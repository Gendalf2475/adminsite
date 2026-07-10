import { PageHeader } from "@/components/layout/page-header";
import { TicketChat } from "@/components/tickets/ticket-chat";
import { listTickets } from "@/services/ticket.service";
import { mapTicketRow } from "@/services/view-models";
import { requirePagePermission } from "@/lib/auth";

export default async function TicketsPage() {
  await requirePagePermission("tickets.view");
  const rows = (await listTickets()).map(mapTicketRow);

  return (
    <>
      <PageHeader
        eyebrow="Техподдержка"
        title="Тикеты игроков"
        description="Единая очередь обращений из Telegram и Discord с публичными ответами, внутренними заметками, тегами и назначениями."
      />
      <TicketChat rows={rows} />
    </>
  );
}
