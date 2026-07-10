# MAJURE Adminsite

Production-ready admin panel for MAJURE: staff management, applications, support tickets, RBAC, audit log, Minecraft command queue, Telegram/Discord support intake, and Google Forms webhook intake.

## Stack

- Next.js App Router + TypeScript
- Prisma + PostgreSQL
- Telegram Login Widget for admin auth
- Telegram Bot API support webhook
- Discord Gateway support worker
- Docker Compose for VPS deployment
- Vitest

## Local Setup

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Required `.env` values:

```env
DATABASE_URL="postgresql://majure:majure@localhost:5432/majure_admin?schema=public"
AUTH_SECRET="replace-with-a-long-random-secret"
TELEGRAM_BOT_TOKEN="123456:telegram-bot-token"
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME="MajureAdminBot"
TELEGRAM_WEBHOOK_SECRET="replace-with-telegram-webhook-secret"
OWNER_TELEGRAM_ID="123456789"
OWNER_TELEGRAM_USERNAME="owner"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
MINECRAFT_PLUGIN_API_TOKEN="replace-with-plugin-token"
LUCKPERMS_STAFF_GROUPS="developer,support,staff,st.moder,moder,st.helper,helper,junior"
GOOGLE_FORMS_WEBHOOK_SECRET="replace-with-google-forms-webhook-secret"
DISCORD_ENABLED="false"
DISCORD_BOT_TOKEN=""
SUPPORT_WORKER_POLL_INTERVAL_MS="5000"
```

In development only, `/login` shows `Dev-вход Owner`.

## Docker VPS

```bash
cp .env.example .env
docker compose up -d --build
```

Compose starts:

- `postgres`
- `migrate`: `prisma migrate deploy && prisma db seed`
- `web`: Next standalone server on port `3000`
- `support-worker`: Discord DM listener and Telegram/Discord outbound queue processor

For manual production maintenance:

```bash
docker compose run --rm migrate
docker compose logs -f web support-worker
```

## Webhooks

Telegram support webhook:

```text
POST /api/integrations/telegram/webhook
X-Telegram-Bot-Api-Secret-Token: $TELEGRAM_WEBHOOK_SECRET
```

Set it with Bot API:

```bash
curl "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -d "url=$NEXT_PUBLIC_APP_URL/api/integrations/telegram/webhook" \
  -d "secret_token=$TELEGRAM_WEBHOOK_SECRET"
```

Google Forms Apps Script webhook:

```text
POST /api/integrations/google-forms/webhook
Authorization: Bearer $GOOGLE_FORMS_WEBHOOK_SECRET
```

Payload:

```json
{
  "rowId": "sheet-row-123",
  "submittedAt": "2026-07-09T12:00:00.000Z",
  "candidateUsername": "PlayerName",
  "telegramUsername": "@player",
  "telegramId": "123456",
  "discordUsername": "player",
  "answers": {
    "Возраст": "18",
    "Опыт": "Модерировал сервер"
  }
}
```

Minimal Apps Script example:

```js
function onFormSubmit(e) {
  const values = e.namedValues;
  UrlFetchApp.fetch("https://admin.example.com/api/integrations/google-forms/webhook", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer GOOGLE_FORMS_WEBHOOK_SECRET" },
    payload: JSON.stringify({
      rowId: String(e.range.getRow()),
      submittedAt: new Date().toISOString(),
      candidateUsername: values["Ник"]?.[0],
      telegramUsername: values["Telegram"]?.[0],
      discordUsername: values["Discord"]?.[0],
      answers: Object.fromEntries(Object.entries(values).map(([key, value]) => [key, value[0]])),
    }),
  });
}
```

Minecraft plugin endpoints:

- `POST /api/integrations/minecraft/sync-staff`
- `POST /api/integrations/minecraft/pull-commands`
- `POST /api/integrations/minecraft/command-result`

All require:

```text
Authorization: Bearer $MINECRAFT_PLUGIN_API_TOKEN
```

`LUCKPERMS_STAFF_GROUPS` is the site-side allowlist for the rank dropdown and server-side validation. Keep it aligned with the Minecraft plugin `staffGroups` config.

Minecraft plugin build:

```bash
cd minecraft-plugin
./gradlew build
```

Install `build/libs/MajureLuckPermsBridge-0.2.0.jar` on the Paper server with LuckPerms installed, then set the generated plugin `config.yml` `apiToken` to the same value as `MINECRAFT_PLUGIN_API_TOKEN`.

## Support Flow

Players write to Telegram or Discord bots.

- Telegram messages arrive via webhook and create/update `Ticket`.
- Discord DMs are handled by `support-worker` through Discord Gateway and create/update `Ticket`.
- Admin public replies from `/tickets` create `TicketMessage` plus `SupportOutboundMessage`.
- `support-worker` sends outbound messages through Telegram Bot API or Discord DM.
- Internal notes are saved only in adminsite.

Outbound retries use `5s`, `30s`, `120s`, `300s` backoff and fail permanently after 8 attempts.

## Verification

```bash
env DATABASE_URL=postgresql://majure:majure@localhost:5432/majure_admin npx prisma validate
npx tsc --noEmit --incremental false
npm test
npm run build
```
