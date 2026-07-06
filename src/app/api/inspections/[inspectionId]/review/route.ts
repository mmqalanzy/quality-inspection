import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { reviewInspection } from "@/server/inspections/review-inspection";

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
  const body = await request.json().catch(() => null);

  if (!body || typeof body.decision !== "string") {
    return NextResponse.json({ ok: false, message: "قرار المراجعة مطلوب." }, { status: 400 });
  }

  if (body.decision !== "approve" && body.decision !== "return") {
    return NextResponse.json({ ok: false, message: "القرار يجب أن يكون approve أو return." }, { status: 400 });
  }

  const result = await reviewInspection(user, inspectionId, body.decision, body.reviewNote);

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result);
}
