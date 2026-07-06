import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";

export async function GET() {
  const user = await readSession();

  if (!user) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: user.id,
      fullName: user.fullName,
      role: user.role
    }
  });
}
