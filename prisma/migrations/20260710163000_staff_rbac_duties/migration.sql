-- CreateTable
CREATE TABLE "RoleDutyDefault" (
    "id" TEXT NOT NULL,
    "rankRoleId" TEXT NOT NULL,
    "dutyRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoleDutyDefault_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StaffDutyOverride" (
    "id" TEXT NOT NULL,
    "staffMemberId" TEXT NOT NULL,
    "dutyRoleId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StaffDutyOverride_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoleDutyDefault_rankRoleId_dutyRoleId_key" ON "RoleDutyDefault"("rankRoleId", "dutyRoleId");
CREATE INDEX "RoleDutyDefault_dutyRoleId_idx" ON "RoleDutyDefault"("dutyRoleId");
CREATE UNIQUE INDEX "StaffDutyOverride_staffMemberId_dutyRoleId_key" ON "StaffDutyOverride"("staffMemberId", "dutyRoleId");
CREATE INDEX "StaffDutyOverride_dutyRoleId_idx" ON "StaffDutyOverride"("dutyRoleId");

-- AddForeignKey
ALTER TABLE "RoleDutyDefault" ADD CONSTRAINT "RoleDutyDefault_rankRoleId_fkey" FOREIGN KEY ("rankRoleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RoleDutyDefault" ADD CONSTRAINT "RoleDutyDefault_dutyRoleId_fkey" FOREIGN KEY ("dutyRoleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffDutyOverride" ADD CONSTRAINT "StaffDutyOverride_staffMemberId_fkey" FOREIGN KEY ("staffMemberId") REFERENCES "StaffMember"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "StaffDutyOverride" ADD CONSTRAINT "StaffDutyOverride_dutyRoleId_fkey" FOREIGN KEY ("dutyRoleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Preserve the old support duty and owner assignments while replacing the legacy role set.
UPDATE "Role"
SET "key" = 'legacy_support_duty', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'support' AND "kind" = 'DUTY' AND EXISTS (SELECT 1 FROM "Role" WHERE "key" = 'duty_support');

UPDATE "Role"
SET "key" = 'duty_support', "name" = 'Техподдержка', "priority" = 50, "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'support' AND "kind" = 'DUTY';

UPDATE "Role"
SET "key" = 'legacy_owner', "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'owner' AND EXISTS (SELECT 1 FROM "Role" WHERE "key" = 'developer');

UPDATE "Role"
SET "key" = 'developer', "name" = 'Developer', "kind" = 'STAFF_RANK', "priority" = 800, "updatedAt" = CURRENT_TIMESTAMP
WHERE "key" = 'owner';

INSERT INTO "Role" ("id", "key", "name", "kind", "description", "priority", "createdAt", "updatedAt") VALUES
('role-developer-v2', 'developer', 'Developer', 'STAFF_RANK', 'Высший рабочий ранг с полным доступом.', 800, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-support-v2', 'support', 'Support', 'STAFF_RANK', 'Полный доступ без возможности управлять developer.', 700, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-staff-v2', 'staff', 'Staff', 'STAFF_RANK', 'Старший состав администрации.', 600, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-st-moder-v2', 'st.moder', 'Старший модератор', 'STAFF_RANK', NULL, 500, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-moder-v2', 'moder', 'Модератор', 'STAFF_RANK', NULL, 400, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-st-helper-v2', 'st.helper', 'Старший хелпер', 'STAFF_RANK', NULL, 300, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-helper-v2', 'helper', 'Хелпер', 'STAFF_RANK', NULL, 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-junior-v2', 'junior', 'Junior', 'STAFF_RANK', NULL, 100, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('role-duty-support-v2', 'duty_support', 'Техподдержка', 'DUTY', 'Дополнительная занятость на сайте, не связанная с LuckPerms.', 50, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO UPDATE SET
    "name" = EXCLUDED."name",
    "kind" = EXCLUDED."kind",
    "description" = EXCLUDED."description",
    "priority" = EXCLUDED."priority",
    "updatedAt" = CURRENT_TIMESTAMP;

-- Developer and support always have every application permission.
DELETE FROM "_PermissionToRole"
WHERE "B" IN (SELECT "id" FROM "Role" WHERE "key" IN ('developer', 'support', 'staff', 'st.moder', 'moder', 'st.helper', 'helper', 'junior', 'duty_support'));

INSERT INTO "_PermissionToRole" ("A", "B")
SELECT permission."id", role."id"
FROM "Permission" permission
CROSS JOIN "Role" role
WHERE role."key" IN ('developer', 'support')
ON CONFLICT DO NOTHING;

-- Conservative defaults for lower ranks; developer and support can edit them later.
WITH defaults("roleKey", "permissionKey") AS (
    VALUES
    ('staff', 'staff.view'),
    ('staff', 'staff.manage'),
    ('staff', 'staff.change_luckperms_group'),
    ('staff', 'applications.view'),
    ('staff', 'applications.manage'),
    ('staff', 'applications.accept'),
    ('staff', 'applications.reject'),
    ('staff', 'applications.send_report'),
    ('staff', 'settings.view'),
    ('staff', 'audit.view'),
    ('st.moder', 'staff.view'),
    ('st.moder', 'applications.view'),
    ('st.moder', 'applications.manage'),
    ('st.moder', 'applications.accept'),
    ('st.moder', 'applications.reject'),
    ('st.moder', 'applications.send_report'),
    ('st.moder', 'audit.view'),
    ('moder', 'staff.view'),
    ('moder', 'applications.view'),
    ('moder', 'applications.manage'),
    ('moder', 'applications.accept'),
    ('moder', 'applications.reject'),
    ('st.helper', 'staff.view'),
    ('st.helper', 'applications.view'),
    ('st.helper', 'applications.manage'),
    ('helper', 'staff.view'),
    ('helper', 'applications.view'),
    ('junior', 'staff.view'),
    ('duty_support', 'tickets.view'),
    ('duty_support', 'tickets.reply'),
    ('duty_support', 'tickets.close'),
    ('duty_support', 'tickets.assign')
)
INSERT INTO "_PermissionToRole" ("A", "B")
SELECT permission."id", role."id"
FROM defaults
JOIN "Permission" permission ON permission."key" = defaults."permissionKey"
JOIN "Role" role ON role."key" = defaults."roleKey"
ON CONFLICT DO NOTHING;

INSERT INTO "RoleDutyDefault" ("id", "rankRoleId", "dutyRoleId")
SELECT 'default-staff-support-duty', rank_role."id", duty_role."id"
FROM "Role" rank_role
CROSS JOIN "Role" duty_role
WHERE rank_role."key" = 'staff' AND duty_role."key" = 'duty_support'
ON CONFLICT ("rankRoleId", "dutyRoleId") DO NOTHING;

-- Migrate existing staff rank names to the new hierarchy.
UPDATE "StaffMember"
SET "currentLuckPermsGroup" = CASE "currentLuckPermsGroup"
    WHEN 'owner' THEN 'developer'
    WHEN 'curator' THEN 'support'
    WHEN 'senior_admin' THEN 'staff'
    WHEN 'admin' THEN 'st.moder'
    WHEN 'moderator' THEN 'moder'
    WHEN 'viewer' THEN 'junior'
    ELSE "currentLuckPermsGroup"
END,
"pendingLuckPermsGroup" = CASE "pendingLuckPermsGroup"
    WHEN 'owner' THEN 'developer'
    WHEN 'curator' THEN 'support'
    WHEN 'senior_admin' THEN 'staff'
    WHEN 'admin' THEN 'st.moder'
    WHEN 'moderator' THEN 'moder'
    WHEN 'viewer' THEN 'junior'
    ELSE "pendingLuckPermsGroup"
END,
"updatedAt" = CURRENT_TIMESTAMP
WHERE "currentLuckPermsGroup" IN ('owner', 'curator', 'senior_admin', 'admin', 'moderator', 'viewer')
   OR "pendingLuckPermsGroup" IN ('owner', 'curator', 'senior_admin', 'admin', 'moderator', 'viewer');

-- Link or provision site users from staff Telegram IDs.
UPDATE "User" user_record
SET "staffMemberId" = staff."id", "displayName" = staff."username", "updatedAt" = CURRENT_TIMESTAMP
FROM "StaffMember" staff
WHERE staff."telegramId" IS NOT NULL
  AND staff."telegramId" = user_record."telegramId"
  AND (user_record."staffMemberId" IS NULL OR user_record."staffMemberId" = staff."id");

INSERT INTO "User" ("id", "telegramId", "displayName", "active", "staffMemberId", "createdAt", "updatedAt")
SELECT 'user-staff-' || md5(staff."id"), staff."telegramId", staff."username", staff."status" <> 'REMOVED', staff."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "StaffMember" staff
WHERE staff."telegramId" IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM "User" user_record WHERE user_record."telegramId" = staff."telegramId")
  AND NOT EXISTS (SELECT 1 FROM "User" user_record WHERE user_record."staffMemberId" = staff."id")
ON CONFLICT DO NOTHING;

UPDATE "User" user_record
SET "active" = staff."status" <> 'REMOVED', "updatedAt" = CURRENT_TIMESTAMP
FROM "StaffMember" staff
WHERE user_record."staffMemberId" = staff."id";

-- Rebuild managed rank assignments from each linked staff member's current group.
DELETE FROM "UserRole" user_role
USING "Role" role
WHERE user_role."roleId" = role."id" AND role."kind" IN ('OWNER', 'STAFF_RANK');

INSERT INTO "UserRole" ("id", "userId", "roleId", "startsAt", "active", "createdAt")
SELECT 'rank-' || md5(user_record."id" || role."id"), user_record."id", role."id", CURRENT_TIMESTAMP, staff."status" <> 'REMOVED', CURRENT_TIMESTAMP
FROM "User" user_record
JOIN "StaffMember" staff ON staff."id" = user_record."staffMemberId"
JOIN "Role" role ON role."key" = staff."currentLuckPermsGroup" AND role."kind" = 'STAFF_RANK'
ON CONFLICT ("userId", "roleId") DO UPDATE SET "active" = EXCLUDED."active", "expiresAt" = NULL;

-- Staff receives the support duty by default. Existing personal duty roles remain intact.
INSERT INTO "UserRole" ("id", "userId", "roleId", "startsAt", "active", "createdAt")
SELECT 'duty-' || md5(user_record."id" || duty_role."id"), user_record."id", duty_role."id", CURRENT_TIMESTAMP, staff."status" <> 'REMOVED', CURRENT_TIMESTAMP
FROM "User" user_record
JOIN "StaffMember" staff ON staff."id" = user_record."staffMemberId"
JOIN "Role" rank_role ON rank_role."key" = staff."currentLuckPermsGroup"
JOIN "RoleDutyDefault" role_default ON role_default."rankRoleId" = rank_role."id"
JOIN "Role" duty_role ON duty_role."id" = role_default."dutyRoleId"
ON CONFLICT ("userId", "roleId") DO UPDATE SET "active" = EXCLUDED."active", "expiresAt" = NULL;

-- Remove obsolete role cards after assignments have been rebuilt.
DELETE FROM "Role"
WHERE "key" IN ('legacy_owner', 'legacy_support_duty', 'curator', 'senior_admin', 'admin', 'moderator', 'viewer');
