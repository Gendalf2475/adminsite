import { NextResponse, type NextRequest } from "next/server";
import { TicketStatus } from "@prisma/client";
import { requireApiPermission } from "@/lib/auth";
import { updateTicketStatus } from "@/services/ticket.service";

export const runtime = "nodejs";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("tickets.close");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  return NextResponse.json({ data: await updateTicketStatus(id, TicketStatus.CLOSED, guard.user.id) });
}
