import type { AuthUser } from "@/types/domain";

export const STAFF_RANK_KEYS = ["developer", "support", "staff", "st.moder", "moder", "st.helper", "helper", "junior"] as const;
export const FULL_ACCESS_ROLE_KEYS = ["developer", "support"] as const;
export const SUPPORT_DUTY_KEY = "duty_support";

export type StaffRankKey = (typeof STAFF_RANK_KEYS)[number];
export type StaffDutyMode = "INHERIT" | "ENABLED" | "DISABLED";

export const roleLabels: Record<string, string> = {
  developer: "Developer",
  support: "Support",
  staff: "Staff",
  "st.moder": "Старший модератор",
  moder: "Модератор",
  "st.helper": "Старший хелпер",
  helper: "Хелпер",
  junior: "Junior",
  [SUPPORT_DUTY_KEY]: "Техподдержка",
};

export function getStaffRankKey(user: Pick<AuthUser, "roles">) {
  return STAFF_RANK_KEYS.find((key) => user.roles.some((role) => role.key === key)) ?? null;
}

export function isRoleManager(user: Pick<AuthUser, "roles">) {
  const rank = getStaffRankKey(user);
  return rank === "developer" || rank === "support";
}

export function canManageStaffGroup(user: Pick<AuthUser, "roles">, targetGroup: string) {
  const rank = getStaffRankKey(user);
  if (rank === "developer") return true;
  if (rank === "support") return targetGroup !== "developer";
  const actorIndex = rank ? STAFF_RANK_KEYS.indexOf(rank) : -1;
  const targetIndex = STAFF_RANK_KEYS.indexOf(targetGroup as StaffRankKey);
  return actorIndex >= 0 && targetIndex > actorIndex;
}

export function canAssignStaffGroup(user: Pick<AuthUser, "roles">, nextGroup: string) {
  const rank = getStaffRankKey(user);
  if (rank === "developer") return STAFF_RANK_KEYS.includes(nextGroup as StaffRankKey);
  if (rank === "support") return nextGroup !== "developer" && STAFF_RANK_KEYS.includes(nextGroup as StaffRankKey);
  const actorIndex = rank ? STAFF_RANK_KEYS.indexOf(rank) : -1;
  const nextIndex = STAFF_RANK_KEYS.indexOf(nextGroup as StaffRankKey);
  return actorIndex >= 0 && nextIndex > actorIndex;
}

export function canEditRole(user: Pick<AuthUser, "roles">, targetRoleKey: string) {
  return isRoleManager(user) && !FULL_ACCESS_ROLE_KEYS.includes(targetRoleKey as (typeof FULL_ACCESS_ROLE_KEYS)[number]);
}

export function resolveDutyEffective(defaultEnabled: boolean, mode: StaffDutyMode) {
  if (mode === "ENABLED") return true;
  if (mode === "DISABLED") return false;
  return defaultEnabled;
}
