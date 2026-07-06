import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { createInspection } from "@/server/inspections/create-inspection";

export async function POST(request: Request) {
  const user = await readSession();

  if (!user) {
    return NextResponse.json({ ok: false, message: "يجب تسجيل الدخول." }, { status: 401 });
  }

  const result = await createInspection(user, await request.json().catch(() => null));

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result);
}
