import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("staff.view");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  const data = await prisma.staffHistory.findMany({
    where: { staffMemberId: id },
    include: { actor: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data });
}
