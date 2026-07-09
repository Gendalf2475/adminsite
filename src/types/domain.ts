import type { PermissionKey } from "@/config/permissions";

export type StaffStatus = "ACTIVE" | "REMOVED" | "VACATION" | "PROBATION";
export type ApplicationStatus = "NEW" | "IN_PROGRESS" | "REVIEW" | "ACCEPTED" | "REJECTED" | "NEEDS_INFO" | "REPORT_SENT";
export type TicketStatus = "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_PLAYER" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketSource = "TELEGRAM" | "DISCORD";
export type CommandStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "EXPIRED";

export type RoleSummary = {
  id: string;
  key: string;
  name: string;
  kind: "OWNER" | "STAFF_RANK" | "DUTY" | "SYSTEM";
  permissions: PermissionKey[];
};

export type AuthUser = {
  id: string;
  telegramId: string;
  telegramUsername?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  roles: RoleSummary[];
  permissions: PermissionKey[];
  isDemo?: boolean;
};

export type StaffRow = {
  id: string;
  username: string;
  uuid: string;
  telegramId?: string;
  discordUsername?: string;
  currentLuckPermsGroup: string;
  pendingLuckPermsGroup?: string | null;
  projectPosition: string;
  assignedAt: string;
  assignedBy: string;
  status: StaffStatus;
  notes?: string;
};

export type ApplicationRow = {
  id: string;
  googleSheetRowId: string;
  submittedAt: string;
  candidateUsername: string;
  telegramUsername?: string;
  discordUsername?: string;
  status: ApplicationStatus;
  assignedReviewer?: string;
  answers: Record<string, string>;
  comments: Array<{ id: string; author: string; body: string; createdAt: string }>;
};

export type TicketRow = {
  id: string;
  source: TicketSource;
  externalThreadId: string;
  playerUsername?: string;
  externalUsername: string;
  title: string;
  status: TicketStatus;
  priority: TicketPriority;
  assignedUser?: string;
  tags: string[];
  createdAt: string;
  messages: Array<{
    id: string;
    authorType: "PLAYER" | "ADMIN" | "SYSTEM";
    authorName: string;
    body: string;
    visibility: "PUBLIC" | "INTERNAL";
    createdAt: string;
  }>;
};

export type AuditLogRow = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entityId?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type IntegrationStatus = {
  id: string;
  name: string;
  description: string;
  status: "online" | "mock" | "warning" | "offline";
  lastSync: string;
  contract: string;
};

export type MinecraftCommand = {
  id: string;
  type: string;
  payload: Record<string, unknown>;
  status: CommandStatus;
  attempts: number;
  createdAt: Date;
  expiresAt?: Date | null;
};
