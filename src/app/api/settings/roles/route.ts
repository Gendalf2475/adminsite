import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseJson } from "@/lib/api";
import { requireApiPermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";

export const runtime = "nodejs";

const updateRoleSchema = z.object({
  roleKey: z.string(),
  permissionKeys: z.array(z.string()),
});

export async function GET() {
  const guard = await requireApiPermission("settings.view");
  if (!guard.ok) return guard.response;

  const data = await prisma.role.findMany({
    include: { permissions: true },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
  });

  return NextResponse.json({ data });
}

export async function PATCH(request: NextRequest) {
  const guard = await requireApiPermission("settings.manage");
  if (!guard.ok) return guard.response;

  const parsed = await parseJson(request, updateRoleSchema);
  if (!parsed.success) return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 422 });

  const before = await prisma.role.findUnique({
    where: { key: parsed.data.roleKey },
    include: { permissions: true },
  });

  const data = await prisma.role.update({
    where: { key: parsed.data.roleKey },
    data: {
      permissions: {
        set: parsed.data.permissionKeys.map((key) => ({ key })),
      },
    },
    include: { permissions: true },
  });

  await writeAuditLog({
    actorUserId: guard.user.id,
    action: "role.permissions_updated",
    entityType: "Role",
    entityId: data.id,
    oldValue: before?.permissions.map((permission) => permission.key),
    newValue: parsed.data.permissionKeys,
  });

  return NextResponse.json({ data });
}
