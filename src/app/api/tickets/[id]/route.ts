import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { getTicket } from "@/services/ticket.service";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("tickets.view");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  const data = await getTicket(id);
  if (!data) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  return NextResponse.json({ data });
}
