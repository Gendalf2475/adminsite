import { PageHeader } from "@/components/layout/page-header";
import { StaffDirectory } from "@/components/staff/staff-directory";
import { getConfiguredLuckPermsStaffGroups, isLuckPermsIntegrationConfigured } from "@/services/luckperms.service";
import { listStaff } from "@/services/staff.service";
import { mapStaffRow } from "@/services/view-models";
import { requirePagePermission } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { canAssignStaffGroup } from "@/config/roles";

export default async function StaffPage() {
  const user = await requirePagePermission("staff.view");
  const rows = (await listStaff()).map((staff) => mapStaffRow(staff));
  const luckPermsGroups = getConfiguredLuckPermsStaffGroups().filter((group) => canAssignStaffGroup(user, group));
  const luckPermsReady = isLuckPermsIntegrationConfigured();
  const canCreate = hasPermission(user.permissions, "staff.manage") && luckPermsGroups.length > 0;

  return (
    <>
      <PageHeader
        eyebrow="Персонал"
        title="Управление составом"
      />
      <StaffDirectory rows={rows} luckPermsReady={luckPermsReady} luckPermsGroups={luckPermsGroups} canCreate={canCreate} />
    </>
  );
}
