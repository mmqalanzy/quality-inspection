import { prisma } from "@/server/db";
import { getServerEnv } from "@/server/env";
import { type SessionUser } from "@/server/auth/session-core";
import { getSupabaseClient } from "@/server/supabase/supabase-client";
import { canEditInspection } from "./inspection-access";

const allowedMimeTypes = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif"
]);

export type PrepareUploadResult =
  | {
      ok: true;
      photoId: string;
      storageKey: string;
      uploadUrl: string;
      thumbStorageKey: string;
      thumbUploadUrl: string;
    }
  | { ok: false; status: number; message: string };

export async function preparePhotoUpload(
  user: SessionUser,
  itemId: string,
  fileName: string,
  mimeType: string,
  fileSize: number
): Promise<PrepareUploadResult> {
  const env = getServerEnv();
  const maxBytes = env.MAX_IMAGE_SIZE_MB * 1024 * 1024;

  if (fileSize > maxBytes) {
    return {
      ok: false,
      status: 413,
      message: `حجم الصورة يتجاوز الحد المسموح (${env.MAX_IMAGE_SIZE_MB} ميجابايت).`
    };
  }

  const normalizedMimeType = mimeType.toLowerCase();
  if (!allowedMimeTypes.has(normalizedMimeType)) {
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
  const ext = fileName.split(".").pop()?.toLowerCase() || "jpg";
  const storageKey = `inspections/${existing.inspection.id}/items/${itemId}/${photoId}.${ext}`;
  const thumbStorageKey = `${storageKey}-thumb`;

  const supabase = getSupabaseClient();

  const [fullResult, thumbResult] = await Promise.all([
    supabase.storage.from("inspection-photos").createSignedUploadUrl(storageKey),
    supabase.storage.from("inspection-photos").createSignedUploadUrl(thumbStorageKey)
  ]);

  if (fullResult.error || !fullResult.data?.signedUrl || thumbResult.error || !thumbResult.data?.signedUrl) {
    console.error("Supabase signed URL error:", fullResult.error, thumbResult.error);
    return {
      ok: false,
      status: 502,
      message: "تعذر إعداد روابط الرفع."
    };
  }

  return {
    ok: true,
    photoId,
    storageKey,
    uploadUrl: fullResult.data.signedUrl,
    thumbStorageKey,
    thumbUploadUrl: thumbResult.data.signedUrl
  };
}
