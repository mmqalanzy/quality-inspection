import { prisma } from "@/server/db";
import { type SessionUser } from "@/server/auth/session-core";
import { canEditInspection } from "./inspection-access";

export type ConfirmUploadResult =
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

export async function confirmPhotoUpload(
  user: SessionUser,
  itemId: string,
  photoId: string,
  storageKey: string,
  originalFileName: string,
  mimeType: string,
  fileSize: number
): Promise<ConfirmUploadResult> {
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

  const sortOrder = await prisma.evidencePhoto.count({ where: { inspectionItemId: itemId } });

  const photo = await prisma.evidencePhoto.create({
    data: {
      id: photoId,
      inspectionItemId: itemId,
      storageKey,
      originalFileName: originalFileName || null,
      mimeType,
      fileSize,
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
