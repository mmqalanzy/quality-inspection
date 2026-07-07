import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { recallInspection } from "@/server/inspections/recall-inspection";

type Props = {
  params: Promise<{
    inspectionId: string;
  }>;
};

export async function POST(request: Request, { params }: Props) {
  const user = await readSession();

  if (!user) {
    return NextResponse.json({ ok: false, message: "يجب تسجيل الدخول." }, { status: 401 });
  }

  const { inspectionId } = await params;
  const result = await recallInspection(user, inspectionId);

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result);
}
