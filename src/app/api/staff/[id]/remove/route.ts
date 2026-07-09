import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { removeStaffMember } from "@/services/staff.service";

export const runtime = "nodejs";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("staff.manage");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  return NextResponse.json({ data: await removeStaffMember(id, guard.user.id) });
}
