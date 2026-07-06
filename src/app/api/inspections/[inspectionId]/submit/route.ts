import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { submitInspection } from "@/server/inspections/submit-inspection";

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
  const formData = await request.formData().catch(() => null);
  const reportFile = formData?.get("report");

  if (!(reportFile instanceof Blob)) {
    return NextResponse.json({ ok: false, message: "لم يتم إرفاق التقرير." }, { status: 400 });
  }

  const pdfBuffer = Buffer.from(await reportFile.arrayBuffer());
  const result = await submitInspection(user, inspectionId, pdfBuffer);

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result);
}
