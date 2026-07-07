import { NextResponse } from "next/server";
import { readSession } from "@/server/auth/session";
import { prisma } from "@/server/db";
import { getSupabaseClient } from "@/server/supabase/supabase-client";
import { canReadInspection } from "@/server/inspections/inspection-access";

export const maxDuration = 30;

type Props = {
  params: Promise<{
    photoId: string;
  }>;
};

export async function GET(_request: Request, { params }: Props) {
  const user = await readSession();

  if (!user) {
    return NextResponse.json({ ok: false, message: "يجب تسجيل الدخول." }, { status: 401 });
  }

  const { photoId } = await params;
  const photo = await prisma.evidencePhoto.findUnique({
    where: { id: photoId },
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
      inspectionItem: {
        select: { inspection: { select: { inspectorId: true } } }
      }
    }
  });

  if (!photo) {
    return NextResponse.json({ ok: false, message: "الصورة غير موجودة." }, { status: 404 });
  }

  if (!canReadInspection(user, photo.inspectionItem.inspection.inspectorId)) {
    return NextResponse.json({ ok: false, message: "ليست لديك صلاحية." }, { status: 403 });
  }

  const thumbStorageKey = `${photo.storageKey}-thumb`;

  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.storage.from("inspection-photos").download(thumbStorageKey);

    if (error || !data) {
      // Fallback to full image if thumbnail doesn't exist yet
      const fullResult = await supabase.storage.from("inspection-photos").download(photo.storageKey);
      if (fullResult.error || !fullResult.data) {
        return NextResponse.json({ ok: false, message: "تعذر تحميل الصورة." }, { status: 502 });
      }
      const buffer = new Uint8Array(await fullResult.data.arrayBuffer());
      return new NextResponse(buffer, {
        headers: {
          "Content-Type": photo.mimeType,
          "Cache-Control": "private, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET, OPTIONS"
        }
      });
    }

    const buffer = new Uint8Array(await data.arrayBuffer());
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "private, max-age=3600",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS"
      }
    });
  } catch (error) {
    console.error("Thumbnail download error:", error);
    return NextResponse.json({ ok: false, message: "تعذر تحميل الصورة المصغرة." }, { status: 502 });
  }
}
