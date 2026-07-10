import type { PermissionKey } from "@/config/permissions";

export type StaffStatus = "ACTIVE" | "REMOVED" | "VACATION" | "PROBATION";
export type ApplicationStatus = "NEW" | "IN_PROGRESS" | "REVIEW" | "ACCEPTED" | "REJECTED" | "NEEDS_INFO" | "REPORT_SENT";
export type TicketStatus = "NEW" | "OPEN" | "IN_PROGRESS" | "WAITING_PLAYER" | "CLOSED";
export type TicketPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";
export type TicketSource = "TELEGRAM" | "DISCORD";
export type CommandStatus = "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED" | "EXPIRED";
export type OutboundDeliveryStatus = "PENDING" | "PROCESSING" | "SENT" | "FAILED";

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
  telegramId?: string | null;
  discordUsername?: string | null;
  currentLuckPermsGroup: string;
  pendingLuckPermsGroup?: string | null;
  assignedAt: string;
  assignedBy: string;
  status: StaffStatus;
  duties: StaffDutyState[];
};

export type StaffDutyState = {
  key: string;
  name: string;
  mode: "INHERIT" | "ENABLED" | "DISABLED";
  defaultEnabled: boolean;
  effective: boolean;
};

export type ApplicationRow = {
  id: string;
  googleSheetRowId?: string | null;
  submittedAt: string;
  candidateUsername: string;
  telegramUsername?: string | null;
  discordUsername?: string | null;
  status: ApplicationStatus;
  assignedReviewer?: string | null;
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
    deliveryStatus?: OutboundDeliveryStatus;
    deliveryError?: string | null;
  }>;
};

export type AuditLogRow = {
  id: string;
  actor: string;
  action: string;
  entityType: string;
  entity: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
};

export type GlobalSearchResult = {
  type: "staff" | "application" | "ticket";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  status?: StaffStatus | ApplicationStatus | TicketStatus;
};

export type IntegrationStatus = {
  id: string;
  name: string;
  description: string;
  status: "online" | "warning" | "offline";
  lastSync: string;
  contract: string;
};

export type DashboardSummary = {
  visibility: {
    staff: boolean;
    applications: boolean;
    tickets: boolean;
    audit: boolean;
    integrations: boolean;
  };
  metrics: {
    activeStaff: number;
    newApplications: number;
    inWorkApplications: number;
    openTickets: number;
  };
  auditRows: AuditLogRow[];
  integrationStatuses: IntegrationStatus[];
  applicationRows: ApplicationRow[];
  ticketRows: TicketRow[];
  generatedAt: string;
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
