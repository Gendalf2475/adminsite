import { NextResponse } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { mapAuditLogRow } from "@/services/view-models";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireApiPermission("audit.view");
  if (!guard.ok) return guard.response;

  const data = await prisma.auditLog.findMany({
    include: { actor: true },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json({ data: data.map(mapAuditLogRow) }, { headers: { "cache-control": "no-store" } });
}
