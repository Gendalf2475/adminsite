import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { permissionLabels, rolePermissionDefaults } from "@/config/permissions";

const roleLabels: Record<string, string> = {
  owner: "Owner",
  curator: "Curator",
  senior_admin: "Senior Admin",
  admin: "Admin",
  moderator: "Moderator",
  support: "Support",
  viewer: "Viewer",
};

export default function RolesPage() {
  return (
    <>
      <PageHeader
        eyebrow="RBAC"
        title="Роли и права"
        description="Effective permissions собираются как union ранга и допзанятостей. Backend guards используют эти права для API."
      />
      <section className="grid gap-4 xl:grid-cols-2">
        {Object.entries(rolePermissionDefaults).map(([roleKey, permissions]) => (
          <Card key={roleKey}>
            <CardHeader>
              <div>
                <CardTitle>{roleLabels[roleKey] ?? roleKey}</CardTitle>
                <p className="mt-1 text-sm text-[var(--text-muted)]">{permissions.length} permissions</p>
              </div>
              <ShieldCheck className="text-fuchsia-200" size={18} />
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <Badge key={permission} variant="muted">
                  {permissionLabels[permission]}
                </Badge>
              ))}
            </CardContent>
          </Card>
        ))}
      </section>
    </>
  );
}
