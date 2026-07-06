import { NextResponse } from "next/server";
import { getWebhookSecret, handleUpdate } from "@/bot";

export const maxDuration = 10;

export async function POST(request: Request) {
  const secret = request.headers.get("x-telegram-bot-api-secret-token");

  if (secret !== getWebhookSecret()) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const update = await request.json().catch(() => null);

  if (!update) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await handleUpdate(update);
  } catch (error) {
    console.error("Webhook error:", error);
  }

  return NextResponse.json({ ok: true });
}
