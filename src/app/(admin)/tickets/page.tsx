import { PageHeader } from "@/components/layout/page-header";
import { TicketChat } from "@/components/tickets/ticket-chat";
import { ticketRows } from "@/config/mock-data";

export default function TicketsPage() {
  return (
    <>
      <PageHeader
        eyebrow="Техподдержка"
        title="Тикеты игроков"
        description="Единая очередь обращений из Telegram и Discord с публичными ответами, внутренними заметками, тегами и назначениями."
      />
      <TicketChat rows={ticketRows} />
    </>
  );
}
