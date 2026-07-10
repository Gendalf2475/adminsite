import { NextResponse, type NextRequest } from "next/server";
import { StaffStatus } from "@prisma/client";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { changeStaffLuckPermsGroup, getStaffMember, updateStaffDutyMode, updateStaffMember } from "@/services/staff.service";
import { canAssignStaffGroup, canManageStaffGroup, isRoleManager, SUPPORT_DUTY_KEY } from "@/config/roles";
import { hasPermission } from "@/lib/permissions";
import { validateLuckPermsStaffGroup } from "@/services/luckperms.service";
import { StaffAccessConflictError } from "@/services/staff-access.service";

export const runtime = "nodejs";

const updateStaffSchema = z.object({
  status: z.nativeEnum(StaffStatus).optional(),
  telegramId: z.string().nullable().optional(),
  discordUsername: z.string().nullable().optional(),
  currentLuckPermsGroup: z.string().optional(),
  dutyMode: z.enum(["INHERIT", "ENABLED", "DISABLED"]).optional(),
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
  const current = await getStaffMember(id);
  if (!current) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });
  if (!canManageStaffGroup(guard.user, current.currentLuckPermsGroup)) {
    return NextResponse.json({ error: "Нельзя изменять этого сотрудника." }, { status: 403 });
  }

  const group = parsed.data.currentLuckPermsGroup ? validateLuckPermsStaffGroup(parsed.data.currentLuckPermsGroup) : null;
  if (group && !group.ok) return NextResponse.json({ error: group.message }, { status: 422 });
  if (group?.ok && group.group !== current.currentLuckPermsGroup) {
    if (!hasPermission(guard.user.permissions, "staff.change_luckperms_group")) {
      return NextResponse.json({ error: "Нет права на смену ранга." }, { status: 403 });
    }
    if (!canAssignStaffGroup(guard.user, group.group)) {
      return NextResponse.json({ error: "Нельзя назначить этот ранг." }, { status: 403 });
    }
  }
  if (parsed.data.dutyMode && !isRoleManager(guard.user)) {
    return NextResponse.json({ error: "Допзанятости могут менять только developer и support." }, { status: 403 });
  }

  try {
    const data = await updateStaffMember(
      id,
      {
        status: parsed.data.status,
        telegramId: parsed.data.telegramId,
        discordUsername: parsed.data.discordUsername,
      },
      guard.user.id,
    );
    if (parsed.data.dutyMode) {
      await updateStaffDutyMode({ id, dutyKey: SUPPORT_DUTY_KEY, mode: parsed.data.dutyMode, actorUserId: guard.user.id });
    }
    const rankChange = group?.ok && group.group !== current.currentLuckPermsGroup
      ? await changeStaffLuckPermsGroup(id, group.group, guard.user.id)
      : null;

    return NextResponse.json({ data, rankChange }, { status: rankChange?.command ? 202 : 200 });
  } catch (error) {
    if (error instanceof StaffAccessConflictError) return NextResponse.json({ error: error.message }, { status: 409 });
    throw error;
  }
}
