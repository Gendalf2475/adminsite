import { PageHeader } from "@/components/layout/page-header";
import { StaffDirectory } from "@/components/staff/staff-directory";
import { listStaff } from "@/services/staff.service";
import { mapStaffRow } from "@/services/view-models";

export default async function StaffPage() {
  const rows = (await listStaff()).map(mapStaffRow);

  return (
    <>
      <PageHeader
        eyebrow="Персонал"
        title="Управление составом"
        description="Сотрудники, их роли на проекте, группы LuckPerms, статусы и будущая синхронизация с Minecraft-плагином."
      />
      <StaffDirectory rows={rows} />
    </>
  );
}
