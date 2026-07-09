# MAJURE Admin MVP

Админ-панель для Minecraft-проекта MAJURE: персонал, заявки, техподдержка, RBAC, audit log и mock-контракты интеграций.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS + локальные shadcn-style primitives
- Prisma + PostgreSQL
- Telegram Login Widget auth
- REST API route handlers
- Vitest

## Quick Start

1. Установить зависимости:

```bash
npm install
```

2. Создать `.env` из `.env.example` и заполнить минимум:

```bash
DATABASE_URL="postgresql://majure:majure@localhost:5432/majure_admin?schema=public"
AUTH_SECRET="long-random-secret"
TELEGRAM_BOT_TOKEN="123456:telegram-bot-token"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="MajureAdminBot"
OWNER_TELEGRAM_ID="123456789"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
MINECRAFT_PLUGIN_API_TOKEN="replace-with-plugin-token"
```

3. Подготовить Prisma:

```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

4. Запустить dev server:

```bash
npm run dev
```

В development доступна кнопка `Dev-вход Owner` на `/login`, чтобы проверить UI без Telegram.

## API Contracts

Staff:

- `GET /api/staff`
- `GET /api/staff/:id`
- `POST /api/staff`
- `PATCH /api/staff/:id`
- `POST /api/staff/:id/change-group`
- `POST /api/staff/:id/remove`
- `GET /api/staff/:id/history`

Applications:

- `GET /api/applications`
- `GET /api/applications/:id`
- `POST /api/applications/sync`
- `PATCH /api/applications/:id/status`
- `POST /api/applications/:id/comment`
- `POST /api/applications/:id/send-report`
- `POST /api/applications/:id/assign`

Tickets:

- `GET /api/tickets`
- `GET /api/tickets/:id`
- `POST /api/tickets/:id/reply`
- `PATCH /api/tickets/:id/status`
- `POST /api/tickets/:id/assign`
- `POST /api/tickets/:id/close`

Integrations:

- `POST /api/integrations/google-forms/sync`
- `POST /api/integrations/telegram/webhook`
- `POST /api/integrations/discord/webhook`
- `POST /api/integrations/minecraft/pull-commands`
- `POST /api/integrations/minecraft/command-result`
- `POST /api/integrations/minecraft/sync-staff`

## Minecraft Queue

Сайт не выполняет LuckPerms напрямую. Например, смена группы:

1. `POST /api/staff/:id/change-group`
2. Backend создает `MinecraftCommandQueue` со статусом `PENDING`
3. Плагин забирает команды через `POST /api/integrations/minecraft/pull-commands`
4. Плагин отправляет результат в `POST /api/integrations/minecraft/command-result`
5. Backend обновляет статус команды и, при успехе, текущую группу сотрудника

Плагин должен передавать `Authorization: Bearer $MINECRAFT_PLUGIN_API_TOKEN`.

## Verification

```bash
npx prisma validate
npm run typecheck
npm run lint
npm run build
npm test
```
