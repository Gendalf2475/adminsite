import { Settings } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { requirePagePermission } from "@/lib/auth";

export default async function SettingsPage() {
  await requirePagePermission("settings.view");
  return (
    <>
      <PageHeader
        eyebrow="Настройки"
        title="Параметры панели"
        description="Точки входа для ролей, интеграций и будущих системных настроек админки."
      />
      <Card>
        <CardHeader>
          <CardTitle>Доступные настройки</CardTitle>
          <Settings className="text-[var(--text-faint)]" size={18} />
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="primary">
            <Link href="/settings/roles">Роли и права</Link>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
