import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { confirmPhotoUpload } from "@/server/inspections/confirm-photo-upload";
import { z } from "zod";

const bodySchema = z.object({
  photoId: z.string().uuid(),
  storageKey: z.string().min(1),
  originalFileName: z.string().default(""),
  mimeType: z.string().min(1),
  fileSize: z.number().int().positive()
});

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
  const body = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, message: "بيانات غير صالحة." }, { status: 400 });
  }

  const result = await confirmPhotoUpload(
    user,
    itemId,
    parsed.data.photoId,
    parsed.data.storageKey,
    parsed.data.originalFileName,
    parsed.data.mimeType,
    parsed.data.fileSize
  );

  if (!result.ok) {
    return NextResponse.json(result, { status: result.status });
  }

  return NextResponse.json(result);
}
