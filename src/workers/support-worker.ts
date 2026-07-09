import { Client, Events, GatewayIntentBits, Partials } from "discord.js";
import { TicketSource } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { handleDiscordDirectMessage } from "@/services/discord.service";
import { claimDueOutboundMessages, markOutboundFailed, markOutboundSent } from "@/services/support-outbound.service";
import { sendTelegramReply } from "@/services/telegram.service";

const pollIntervalMs = Number(process.env.SUPPORT_WORKER_POLL_INTERVAL_MS ?? 5000);
const discordEnabled = process.env.DISCORD_ENABLED === "true";

let shuttingDown = false;

async function main() {
  const discordClient = discordEnabled ? createDiscordClient() : null;

  if (discordClient) {
    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token) throw new Error("DISCORD_ENABLED=true but DISCORD_BOT_TOKEN is not configured.");
    await discordClient.login(token);
  }

  await processOutbound(discordClient);
  const interval = setInterval(() => {
    processOutbound(discordClient).catch((error) => {
      console.error("support-worker outbound loop failed", error);
    });
  }, Math.max(1000, pollIntervalMs));

  async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    clearInterval(interval);
    await discordClient?.destroy();
    await prisma.$disconnect();
    process.exit(0);
  }

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

function createDiscordClient() {
  const client = new Client({
    intents: [GatewayIntentBits.DirectMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel],
  });

  client.once(Events.ClientReady, (readyClient) => {
    console.log(`support-worker Discord connected as ${readyClient.user.tag}`);
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot || message.guildId) return;
    try {
      await handleDiscordDirectMessage({
        userId: message.author.id,
        username: message.author.username,
        displayName: message.author.globalName ?? message.author.username,
        messageId: message.id,
        body: message.content,
        attachments: message.attachments.map((attachment) => ({
          id: attachment.id,
          url: attachment.url,
          name: attachment.name,
          contentType: attachment.contentType,
        })),
      });
    } catch (error) {
      console.error("Failed to persist Discord DM", error);
    }
  });

  return client;
}

async function processOutbound(discordClient: Client | null) {
  if (shuttingDown) return;
  const messages = await claimDueOutboundMessages(25);
  for (const message of messages) {
    try {
      if (message.source === TicketSource.TELEGRAM) {
        await sendTelegramReply({ externalThreadId: message.externalThreadId, body: message.body });
      } else if (message.source === TicketSource.DISCORD) {
        if (!discordClient?.isReady()) throw new Error("Discord client is not ready.");
        const user = await discordClient.users.fetch(message.externalThreadId);
        await user.send(message.body);
      } else {
        throw new Error(`Unsupported ticket source: ${message.source}`);
      }
      await markOutboundSent(message.id);
    } catch (error) {
      await markOutboundFailed(message.id, error instanceof Error ? error.message : String(error));
    }
  }
}

main().catch(async (error) => {
  console.error("support-worker failed to start", error);
  await prisma.$disconnect();
  process.exit(1);
});
