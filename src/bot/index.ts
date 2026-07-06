import crypto from "node:crypto";
import { Bot, InlineKeyboard } from "grammy";
import { getServerEnv } from "@/server/env";

let botInstance: Bot | null = null;

export function getWebhookSecret(): string {
  const env = getServerEnv();
  return crypto.createHmac("sha256", "webhook-secret").update(env.TELEGRAM_BOT_TOKEN).digest("hex");
}

export function getBot(): Bot {
  if (botInstance) {
    return botInstance;
  }

  const env = getServerEnv();
  const bot = new Bot(env.TELEGRAM_BOT_TOKEN);

  bot.command("start", async (ctx) => {
    const keyboard = new InlineKeyboard().webApp(
      "فتح نظام توثيق الجودة",
      env.TELEGRAM_WEBAPP_URL
    );

    await ctx.reply(
      "أهلًا بك في نظام توثيق الجودة.\n\nاضغط الزر بالأسفل لفتح التطبيق وبدء العمل.",
      { reply_markup: keyboard }
    );
  });

  bot.command("myid", async (ctx) => {
    if (!ctx.from) return;
    await ctx.reply(`معرّف تليجرام الخاص بك:\n\n<code>${ctx.from.id}</code>`, {
      parse_mode: "HTML"
    });
  });

  bot.catch((err) => {
    console.error("Bot error:", err);
  });

  botInstance = bot;
  return bot;
}

export async function handleUpdate(update: unknown): Promise<void> {
  await getBot().handleUpdate(update as never);
}
