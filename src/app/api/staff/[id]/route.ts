import { NextResponse, type NextRequest } from "next/server";
import { StaffStatus } from "@prisma/client";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { getStaffMember, updateStaffMember } from "@/services/staff.service";

export const runtime = "nodejs";

const updateStaffSchema = z.object({
  projectPosition: z.string().min(2).optional(),
  status: z.nativeEnum(StaffStatus).optional(),
  notes: z.string().optional(),
  telegramId: z.string().nullable().optional(),
  discordUsername: z.string().nullable().optional(),
});

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("staff.view");
  if (!guard.ok) return guard.response;
  const { id } = await context.params;
  const data = await getStaffMember(id);
  if (!data) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("staff.manage");
  if (!guard.ok) return guard.response;
  const parsed = await parseJson(request, updateStaffSchema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  const { id } = await context.params;
  return NextResponse.json({ data: await updateStaffMember(id, parsed.data, guard.user.id) });
}
