import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { getBot } from "@/bot";
import { getServerEnv } from "@/server/env";
import { canReadInspection } from "@/server/inspections/inspection-access";

type Props = {
  params: Promise<{
    inspectionId: string;
  }>;
};

export async function GET(_request: Request, { params }: Props) {
  const user = await readSession();

  if (!user) {
    return NextResponse.json({ ok: false, message: "يجب تسجيل الدخول." }, { status: 401 });
  }

  const { inspectionId } = await params;
  const inspection = await prisma.inspection.findUnique({
    where: { id: inspectionId },
    select: {
      id: true,
      inspectorId: true,
      status: true,
      reportFileId: true
    }
  });

  if (!inspection) {
    return NextResponse.json({ ok: false, message: "التفتيش غير موجود." }, { status: 404 });
  }

  if (!canReadInspection(user, inspection.inspectorId)) {
    return NextResponse.json({ ok: false, message: "ليست لديك صلاحية." }, { status: 403 });
  }

  if (!inspection.reportFileId) {
    return NextResponse.json({ ok: false, message: "التقرير غير متوفر بعد." }, { status: 404 });
  }

  try {
    const env = getServerEnv();
    const bot = getBot();
    const file = await bot.api.getFile(inspection.reportFileId);

    if (!file.file_path) {
      return NextResponse.json({ ok: false, message: "تعذر العثور على مسار الملف." }, { status: 500 });
    }

    const downloadUrl = `https://api.telegram.org/file/bot${env.TELEGRAM_BOT_TOKEN}/${file.file_path}`;
    const pdfResponse = await fetch(downloadUrl);

    if (!pdfResponse.ok) {
      return NextResponse.json({ ok: false, message: "تعذر تنزيل التقرير." }, { status: 502 });
    }

    const buffer = new Uint8Array(await pdfResponse.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="تقرير_${inspectionId}.pdf"`,
        "Cache-Control": "private, max-age=3600"
      }
    });
  } catch (error) {
    console.error("Report download error:", error);
    return NextResponse.json({ ok: false, message: "تعذر تنزيل التقرير." }, { status: 502 });
  }
}
