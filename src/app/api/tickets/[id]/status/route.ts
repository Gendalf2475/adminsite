import { NextResponse, type NextRequest } from "next/server";
import { TicketStatus } from "@prisma/client";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { updateTicketStatus } from "@/services/ticket.service";

export const runtime = "nodejs";

const schema = z.object({ status: z.nativeEnum(TicketStatus) });

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const parsed = await parseJson(request, schema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  const guard = await requireApiPermission(parsed.data.status === TicketStatus.CLOSED ? "tickets.close" : "tickets.reply");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  return NextResponse.json({ data: await updateTicketStatus(id, parsed.data.status, guard.user.id) });
}
