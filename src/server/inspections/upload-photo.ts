import { prisma } from "@/server/db";
import { getMaxImageSizeBytes, getServerEnv } from "@/server/env";
import { canEditInspection } from "./inspection-access";
import { getSupabaseClient } from "@/server/storage/supabase-client";
import { type SessionUser } from "@/server/auth/session-core";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);

export type UploadPhotoResult =
  | {
      ok: true;
      photo: {
        id: string;
        storageKey: string;
        mimeType: string;
        fileSize: number;
        sortOrder: number;
      };
    }
  | { ok: false; status: number; message: string };

export async function uploadInspectionItemPhoto(
  user: SessionUser,
  itemId: string,
  file: File
): Promise<UploadPhotoResult> {
  const env = getServerEnv();
  const maxBytes = getMaxImageSizeBytes();

  if (file.size > maxBytes) {
    return {
      ok: false,
      status: 413,
      message: `حجم الصورة يتجاوز الحد المسموح (${env.MAX_IMAGE_SIZE_MB} ميجابايت).`
    };
  }

  const mimeType = file.type.toLowerCase();
  if (!allowedMimeTypes.has(mimeType)) {
    return {
      ok: false,
      status: 415,
      message: "نوع الصورة غير مدعوم. يُقبل JPEG/PNG/WebP/HEIC."
    };
  }

  const existing = await prisma.inspectionItem.findUnique({
    where: { id: itemId },
    select: {
      id: true,
      inspection: {
        select: {
          id: true,
          inspectorId: true,
          status: true
        }
      }
    }
  });

  if (!existing || !canEditInspection(user, existing.inspection)) {
    return {
      ok: false,
      status: existing ? 403 : 404,
      message: "ليست لديك صلاحية لإضافة صور لهذا البند."
    };
  }

  const photoId = crypto.randomUUID();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const storageKey = `inspections/${existing.inspection.id}/items/${itemId}/${photoId}.${ext}`;

  const buffer = Buffer.from(await file.arrayBuffer());

  const supabase = getSupabaseClient();
  const { error: uploadError } = await supabase.storage
    .from("inspection-photos")
    .upload(storageKey, buffer, {
      contentType: mimeType,
      upsert: false
    });

  if (uploadError) {
    console.error("Supabase upload error:", uploadError);
    return {
      ok: false,
      status: 502,
      message: "تعذر رفع الصورة. تأكد من إعداد Supabase Storage."
    };
  }

  const sortOrder = await prisma.evidencePhoto.count({ where: { inspectionItemId: itemId } });

  const photo = await prisma.evidencePhoto.create({
    data: {
      inspectionItemId: itemId,
      storageKey,
      originalFileName: file.name || null,
      mimeType,
      fileSize: file.size,
      sortOrder
    },
    select: {
      id: true,
      storageKey: true,
      mimeType: true,
      fileSize: true,
      sortOrder: true
    }
  });

  return { ok: true, photo };
}
