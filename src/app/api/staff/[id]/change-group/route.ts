import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { changeStaffLuckPermsGroup } from "@/services/staff.service";

export const runtime = "nodejs";

const schema = z.object({ group: z.string().min(2) });

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireApiPermission("staff.change_luckperms_group");
  if (!guard.ok) return guard.response;
  const parsed = await parseJson(request, schema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });
  const { id } = await context.params;
  return NextResponse.json({ data: await changeStaffLuckPermsGroup(id, parsed.data.group, guard.user.id) }, { status: 202 });
}
