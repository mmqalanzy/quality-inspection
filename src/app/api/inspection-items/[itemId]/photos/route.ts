import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { uploadInspectionItemPhoto } from "@/server/inspections/upload-photo";

export const maxDuration = 30;

type Props = {
  params: Promise<{
    itemId: string;
  }>;
};

export async function POST(request: Request, { params }: Props) {
  const user = await readSession();

  if (!user) {
    return NextResponse.json({ ok: false, message: "يجب تسجيل الدخول." }, { status: 401 });
  }

  const { itemId } = await params;
  const formData = await request.formData().catch(() => null);

  if (!formData) {
    return NextResponse.json({ ok: false, message: "بيانات غير صالحة." }, { status: 400 });
  }

  const file = formData.get("photo");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, message: "لم يتم اختيار صورة." }, { status: 400 });
  }

  const result = await uploadInspectionItemPhoto(user, itemId, file);

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result);
}
