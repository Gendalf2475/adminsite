import { PageHeader } from "@/components/layout/page-header";
import { StaffDirectory } from "@/components/staff/staff-directory";
import { getConfiguredLuckPermsStaffGroups, isLuckPermsIntegrationConfigured } from "@/services/luckperms.service";
import { listStaff } from "@/services/staff.service";
import { mapStaffRow } from "@/services/view-models";

export default async function StaffPage() {
  const rows = (await listStaff()).map(mapStaffRow);
  const luckPermsGroups = getConfiguredLuckPermsStaffGroups();
  const luckPermsReady = isLuckPermsIntegrationConfigured();

  return (
    <>
      <PageHeader
        eyebrow="Персонал"
        title="Управление составом"
      />
      <StaffDirectory rows={rows} luckPermsReady={luckPermsReady} luckPermsGroups={luckPermsGroups} />
    </>
  );
}
