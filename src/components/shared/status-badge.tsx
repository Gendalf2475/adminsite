import { Badge } from "@/components/ui/badge";
import type { ApplicationStatus, CommandStatus, StaffStatus, TicketPriority, TicketStatus } from "@/types/domain";

const labels: Record<string, string> = {
  ACTIVE: "Активен",
  REMOVED: "Снят",
  VACATION: "Отпуск",
  PROBATION: "Испытательный",
  NEW: "Новый",
  IN_PROGRESS: "В работе",
  REVIEW: "На рассмотрении",
  ACCEPTED: "Принято",
  REJECTED: "Отклонено",
  NEEDS_INFO: "Уточнение",
  REPORT_SENT: "Отчет отмечен",
  OPEN: "Открыт",
  WAITING_PLAYER: "Ожидает игрока",
  CLOSED: "Закрыт",
  LOW: "Низкий",
  NORMAL: "Обычный",
  HIGH: "Высокий",
  URGENT: "Срочный",
  PENDING: "В очереди",
  PROCESSING: "Выполняется",
  SUCCESS: "Успешно",
  FAILED: "Ошибка",
  EXPIRED: "Истекло",
};

const variants: Record<string, "default" | "muted" | "success" | "warning" | "danger" | "violet" | "info"> = {
  ACTIVE: "success",
  REMOVED: "danger",
  VACATION: "info",
  PROBATION: "warning",
  NEW: "violet",
  IN_PROGRESS: "info",
  REVIEW: "warning",
  ACCEPTED: "success",
  REJECTED: "danger",
  NEEDS_INFO: "warning",
  REPORT_SENT: "success",
  OPEN: "info",
  WAITING_PLAYER: "warning",
  CLOSED: "muted",
  LOW: "muted",
  NORMAL: "info",
  HIGH: "warning",
  URGENT: "danger",
  PENDING: "warning",
  PROCESSING: "info",
  SUCCESS: "success",
  FAILED: "danger",
  EXPIRED: "muted",
};

export function StatusBadge({
  value,
}: {
  value: StaffStatus | ApplicationStatus | TicketStatus | TicketPriority | CommandStatus;
}) {
  return <Badge variant={variants[value] ?? "default"}>{labels[value] ?? value}</Badge>;
}
