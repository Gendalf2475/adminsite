import { PageHeader } from "@/components/layout/page-header";
import { StaffDirectory } from "@/components/staff/staff-directory";
import { staffRows } from "@/config/mock-data";

export default function StaffPage() {
  return (
    <>
      <PageHeader
        eyebrow="Персонал"
        title="Управление составом"
        description="Сотрудники, их роли на проекте, группы LuckPerms, статусы и будущая синхронизация с Minecraft-плагином."
      />
      <StaffDirectory rows={staffRows} />
    </>
  );
}
