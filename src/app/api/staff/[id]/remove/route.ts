import { NextResponse, type NextRequest } from "next/server";
import { requireApiPermission } from "@/lib/auth";
import { getStaffMember, removeStaffMember } from "@/services/staff.service";
import { canManageStaffGroup } from "@/config/roles";

export const runtime = "nodejs";

export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("staff.manage");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  const staff = await getStaffMember(id);
  if (!staff) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  if (!canManageStaffGroup(guard.user, staff.currentLuckPermsGroup)) {
    return NextResponse.json({ error: "Нельзя снять этого сотрудника." }, { status: 403 });
  }
  return NextResponse.json({ data: await removeStaffMember(id, guard.user.id) });
}
