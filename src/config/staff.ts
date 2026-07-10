import type { StaffStatus } from "@/types/domain";

export const STAFF_STATUSES: StaffStatus[] = ["ACTIVE", "PROBATION", "VACATION", "REMOVED"];

export const staffStatusLabels: Record<StaffStatus, string> = {
  ACTIVE: "Активный",
  PROBATION: "Испытательный",
  VACATION: "В отпуске",
  REMOVED: "Снят",
};
