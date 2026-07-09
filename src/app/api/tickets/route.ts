import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { listTickets } from "@/services/ticket.service";

export const runtime = "nodejs";

export async function GET() {
  const guard = await requireApiPermission("tickets.view");
  if (!guard.ok) return guard.response;
  return NextResponse.json({ data: await listTickets() });
}
