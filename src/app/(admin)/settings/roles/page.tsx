import { PageHeader } from "@/components/layout/page-header";
import { RolesManager, type RoleEditorRow } from "@/components/roles/roles-manager";
import { STAFF_RANK_KEYS, SUPPORT_DUTY_KEY, canEditRole } from "@/config/roles";
import { requirePagePermission } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function RolesPage() {
  const user = await requirePagePermission("settings.view");
  const roles = await prisma.role.findMany({
    where: { key: { in: [...STAFF_RANK_KEYS, SUPPORT_DUTY_KEY] } },
    include: { permissions: true, defaultDuties: { include: { dutyRole: true } } },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
  });
  const rows: RoleEditorRow[] = roles.map((role) => ({
    id: role.id,
    key: role.key,
    name: role.name,
    kind: role.kind as "STAFF_RANK" | "DUTY",
    description: role.description,
    permissionKeys: role.permissions.map((permission) => permission.key) as RoleEditorRow["permissionKeys"],
    defaultDutyKeys: role.defaultDuties.map((item) => item.dutyRole.key),
    editable: canEditRole(user, role.key),
  }));

  return (
    <>
      <PageHeader eyebrow="Доступ" title="Роли и права" />
      <RolesManager roles={rows} />
    </>
  );
}
