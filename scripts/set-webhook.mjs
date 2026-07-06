/* global fetch */
import "dotenv/config";
import crypto from "node:crypto";
import { getServerEnv } from "../src/server/env.ts";

const env = getServerEnv();
const webhookSecret = crypto
  .createHmac("sha256", "webhook-secret")
  .update(env.TELEGRAM_BOT_TOKEN)
  .digest("hex");

const webhookUrl = process.argv[2];

if (!webhookUrl) {
  console.error("Usage: node scripts/set-webhook.mjs <webhook-url>");
  console.error("Example: node scripts/set-webhook.mjs https://your-app.vercel.app/api/bot/webhook");
  process.exit(1);
}

const url = `${webhookUrl}/api/bot/webhook`;

const response = await fetch(
  `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/setWebhook`,
  {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      secret_token: webhookSecret,
      allowed_updates: ["message", "callback_query"]
    })
  }
);

const result = await response.json();

if (result.ok) {
  console.log(`Webhook set successfully: ${url}`);
} else {
  console.error("Failed to set webhook:", result.description);
  process.exit(1);
}
