import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { permissionLabels, type PermissionKey } from "@/config/permissions";
import { prisma } from "@/lib/prisma";

export default async function RolesPage() {
  const roles = await prisma.role.findMany({
    include: { permissions: true },
    orderBy: [{ priority: "desc" }, { name: "asc" }],
  });

  return (
    <>
      <PageHeader
        eyebrow="RBAC"
        title="Роли и права"
        description="Effective permissions собираются как union ранга и допзанятостей. Backend guards используют эти права для API."
      />
      <section className="grid gap-4 xl:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div>
                <CardTitle>{role.name}</CardTitle>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {role.permissions.length} permissions · {role.kind.toLowerCase()}
                </p>
              </div>
              <ShieldCheck className="text-fuchsia-200" size={18} />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {role.permissions.map((permission) => (
                <Badge key={permission.id} variant="muted">
                  {permissionLabels[permission.key as PermissionKey] ?? permission.key}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
