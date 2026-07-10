import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission, requireApiRoleManager } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { PERMISSIONS } from "@/config/permissions";
import { canEditRole } from "@/config/roles";
import { reconcileStaffAccessForRank } from "@/services/staff-access.service";

export const runtime = "nodejs";

const updateRoleSchema = z.object({
  roleKey: z.string(),
  permissionKeys: z.array(z.enum(PERMISSIONS)),
  defaultDutyKeys: z.array(z.string()).optional(),
});

export async function GET() {
  const guard = await requireApiPermission("settings.view");
  if (!guard.ok) return guard.response;

  const data = await prisma.role.findMany({
    include: { permissions: true, defaultDuties: { include: { dutyRole: true } } },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireApiRoleManager();
  if (!guard.ok) return guard.response;

  const parsed = await parseJson(request, updateRoleSchema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });

  const before = await prisma.role.findUnique({
    where: { key: parsed.data.roleKey },
    include: { permissions: true, defaultDuties: { include: { dutyRole: true } } },
  });
  if (!before) return NextResponse.json({ error: "Role not found" }, { status: 404 });
  if (!canEditRole(guard.user, before.key)) {
    return NextResponse.json({ error: "Эту роль нельзя редактировать." }, { status: 403 });
  }

  const dutyRoles = parsed.data.defaultDutyKeys
    ? await prisma.role.findMany({ where: { key: { in: parsed.data.defaultDutyKeys }, kind: "DUTY" } })
    : [];
  if (parsed.data.defaultDutyKeys && dutyRoles.length !== new Set(parsed.data.defaultDutyKeys).size) {
    return NextResponse.json({ error: "Unknown duty role" }, { status: 422 });
  }

  const data = await prisma.$transaction(async (tx) => {
    const updated = await tx.role.update({
      where: { key: parsed.data.roleKey },
      data: {
        permissions: {
          set: parsed.data.permissionKeys.map((key) => ({ key })),
        },
      },
    });
    if (parsed.data.defaultDutyKeys && before.kind === "STAFF_RANK") {
      await tx.roleDutyDefault.deleteMany({ where: { rankRoleId: before.id } });
      if (dutyRoles.length > 0) {
        await tx.roleDutyDefault.createMany({
          data: dutyRoles.map((duty) => ({ rankRoleId: before.id, dutyRoleId: duty.id })),
        });
      }
    }
    return tx.role.findUniqueOrThrow({
      where: { id: updated.id },
      include: { permissions: true, defaultDuties: { include: { dutyRole: true } } },
    });
  });

  if (parsed.data.defaultDutyKeys && before.kind === "STAFF_RANK") {
    await reconcileStaffAccessForRank(before.key);
  }

  await writeAuditLog({
    actorUserId: guard.user.id,
    action: "role.permissions_updated",
    entityType: "Role",
    entityId: data.id,
    oldValue: {
      permissions: before.permissions.map((permission) => permission.key),
      defaultDuties: before.defaultDuties.map((item) => item.dutyRole.key),
    },
    newValue: {
      permissions: parsed.data.permissionKeys,
      defaultDuties: data.defaultDuties.map((item) => item.dutyRole.key),
    },
  });

  return NextResponse.json({ data });
}
