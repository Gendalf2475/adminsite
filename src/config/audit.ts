const actionLabels: Record<string, string> = {
  "staff.created": "Добавил сотрудника",
  "staff.updated": "Изменил данные сотрудника",
  "staff.change_luckperms_group.queued": "Изменил ранг сотрудника",
  "staff.created_luckperms_group.queued": "Назначил первоначальный ранг",
  "staff.minecraft_sync.updated": "Синхронизировал ранг сотрудника с Minecraft",
  "staff.minecraft_sync.created": "Добавил сотрудника из Minecraft",
  "staff.duty.updated": "Изменил допзанятость сотрудника",
  "role.permissions_updated": "Изменил права роли",
  "application.status_changed": "Изменил статус заявки",
  "application.comment.created": "Добавил комментарий к заявке",
  "application.assigned": "Назначил проверяющего заявки",
  "ticket.internal_note.created": "Добавил внутреннюю заметку к тикету",
  "ticket.reply.sent": "Ответил в тикете",
  "ticket.status_changed": "Изменил статус тикета",
  "ticket.assigned": "Назначил ответственного за тикет",
  "minecraft.command.queued": "Отправил команду на Minecraft-сервер",
  "minecraft.command.success": "Команда Minecraft выполнена",
  "minecraft.command.failed": "Команда Minecraft завершилась с ошибкой",
  "minecraft.command.expired": "Истёк срок команды Minecraft",
  "minecraft.command.processing": "Команда Minecraft выполняется",
};

const changedFieldLabels: Record<string, string> = {
  status: "статус",
  telegramId: "Telegram ID",
  discordUsername: "Discord",
  currentLuckPermsGroup: "ранг",
};

export const auditEntityTypeLabels: Record<string, string> = {
  StaffMember: "Сотрудник",
  Application: "Заявка",
  Ticket: "Тикет",
  Role: "Роль",
  MinecraftCommandQueue: "Minecraft-команда",
  User: "Пользователь",
};

export function getAuditActionLabel(action: string, metadata?: Record<string, unknown> | null) {
  if (action === "staff.updated") {
    const fields = Array.isArray(metadata?.changedFields)
      ? Array.from(new Set(metadata.changedFields.map(String).map((field) => changedFieldLabels[field]).filter(Boolean)))
      : [];
    if (fields.length > 0) return `Изменил данные сотрудника: ${fields.join(", ")}`;
  }
  return actionLabels[action] ?? "Выполнил действие";
}
