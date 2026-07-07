"use client";

import { useRef, useState } from "react";
import { triggerNotification } from "@/telegram/webapp";
import { compressImage } from "@/lib/compress-image";
import { createThumbnail } from "@/lib/create-thumbnail";

type ServerPhoto = {
  id: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
};

type OptimisticPhoto = {
  id: string;
  localUrl: string;
  status: "uploading" | "done" | "error";
  error?: string;
};

type Props = {
  itemId: string;
  initialPhotos: ServerPhoto[];
  canEdit: boolean;
  minimumPhotos: number;
};

const UPLOAD_CONCURRENCY = 3;

type UploadTask = {
  file: File;
  localUrl: string;
  localId: string;
};

type PrepareResult = {
  ok: true;
  photoId: string;
  storageKey: string;
  uploadUrl: string;
  thumbStorageKey: string;
  thumbUploadUrl: string;
} | { ok: false; message: string };

async function runWithConcurrency<T>(tasks: (() => Promise<T>)[], concurrency: number): Promise<T[]> {
  const results: T[] = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      results[currentIndex] = await tasks[currentIndex]();
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return results;
}

export function ItemPhotoPicker({ itemId, initialPhotos, canEdit, minimumPhotos }: Props) {
  const [serverPhotos, setServerPhotos] = useState<ServerPhoto[]>(initialPhotos);
  const [optimisticPhotos, setOptimisticPhotos] = useState<OptimisticPhoto[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const inputRef = useRef<HTMLInputElement | null>(null);

  const allPhotos = [
    ...serverPhotos.map((photo) => ({ type: "server" as const, photo })),
    ...optimisticPhotos.map((photo) => ({ type: "optimistic" as const, photo }))
  ];

  const count = allPhotos.length;
  const meetsMinimum = count >= minimumPhotos;

  async function prepareUpload(file: File): Promise<PrepareResult> {
    try {
      const response = await fetch(`/api/inspection-items/${itemId}/photos/prepare`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: file.name,
          mimeType: file.type,
          fileSize: file.size
        })
      });
      return (await response.json()) as PrepareResult;
    } catch {
      return { ok: false, message: "تعذر إعداد رابط الرفع." };
    }
  }

  async function uploadToSupabase(uploadUrl: string, file: File): Promise<boolean> {
    try {
      const response = await fetch(uploadUrl, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type }
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async function confirmUpload(
    photoId: string,
    storageKey: string,
    file: File
  ): Promise<{ ok: boolean; photo?: ServerPhoto; message?: string }> {
    try {
      const response = await fetch(`/api/inspection-items/${itemId}/photos/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoId,
          storageKey,
          originalFileName: file.name,
          mimeType: file.type,
          fileSize: file.size
        })
      });
      return (await response.json()) as { ok: boolean; photo?: ServerPhoto; message?: string };
    } catch {
      return { ok: false, message: "تعذر تأكيد الرفع." };
    }
  }

  async function uploadSingle(task: UploadTask): Promise<{ localId: string; serverPhoto?: ServerPhoto; error?: string }> {
    const [compressed, thumbnail] = await Promise.all([
      compressImage(task.file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 }),
      createThumbnail(task.file, 300)
    ]);

    const prepared = await prepareUpload(compressed);
    if (!prepared.ok) {
      return { localId: task.localId, error: prepared.message };
    }

    const [uploaded, thumbUploaded] = await Promise.all([
      uploadToSupabase(prepared.uploadUrl, compressed),
      uploadToSupabase(prepared.thumbUploadUrl, thumbnail)
    ]);

    if (!uploaded || !thumbUploaded) {
      return { localId: task.localId, error: "تعذر رفع الصورة إلى التخزين." };
    }

    const confirmed = await confirmUpload(prepared.photoId, prepared.storageKey, compressed);
    if (!confirmed.ok || !confirmed.photo) {
      return { localId: task.localId, error: confirmed.message ?? "تعذر تأكيد الرفع." };
    }

    return { localId: task.localId, serverPhoto: confirmed.photo };
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!canEdit) return;

    const fileList = Array.from(files);
    const tasks: UploadTask[] = [];
    const newOptimisticPhotos: OptimisticPhoto[] = [];

    for (const file of fileList) {
      const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });
      const localUrl = URL.createObjectURL(compressed);
      const localId = crypto.randomUUID();
      tasks.push({ file: compressed, localUrl, localId });
      newOptimisticPhotos.push({ id: localId, localUrl, status: "uploading" });
    }

    setOptimisticPhotos((prev) => [...prev, ...newOptimisticPhotos]);
    setIsUploading(true);
    setProgress({ completed: 0, total: tasks.length });

    const uploadTasks = tasks.map((task) => async () => {
      const result = await uploadSingle(task);
      setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
      return result;
    });

    const results = await runWithConcurrency(uploadTasks, UPLOAD_CONCURRENCY);

    for (const result of results) {
      if (result.serverPhoto) {
        setServerPhotos((prev) => [...prev, result.serverPhoto!]);
        setOptimisticPhotos((prev) => prev.filter((p) => p.id !== result.localId));
        URL.revokeObjectURL(tasks.find((t) => t.localId === result.localId)?.localUrl ?? "");
      } else {
        setOptimisticPhotos((prev) =>
          prev.map((p) => (p.id === result.localId ? { ...p, status: "error", error: result.error } : p))
        );
      }
    }

    const errors = results.filter((r) => r.error).length;
    if (errors > 0) {
      triggerNotification("error");
    } else {
      triggerNotification("success");
    }

    setIsUploading(false);
    setProgress({ completed: 0, total: 0 });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-3 grid gap-2">
      {allPhotos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {allPhotos.map((entry, index) => {
            const thumbnailSrc = entry.type === "optimistic" ? entry.photo.localUrl : `/api/evidence-photos/${entry.photo.id}/thumbnail`;
            const fullHref = entry.type === "optimistic" ? entry.photo.localUrl : `/api/evidence-photos/${entry.photo.id}`;
            const status = entry.type === "optimistic" ? entry.photo.status : "done";

            return (
              <a
                key={entry.type === "optimistic" ? entry.photo.id : entry.photo.id}
                href={fullHref}
                target="_blank"
                rel="noreferrer"
                className="relative block overflow-hidden rounded-lg border border-[var(--border)]"
              >
                <img
                  alt={`صورة ${index + 1}`}
                  src={thumbnailSrc}
                  className="h-40 w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
                {status === "uploading" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-xs font-bold text-white">
                    جاري الرفع
                  </div>
                ) : status === "error" ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-600/80 text-xs font-bold text-white">
                    فشل
                  </div>
                ) : null}
                <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
                  {index + 1}
                </span>
              </a>
            );
          })}
        </div>
      ) : null}

      <div className="flex items-center justify-between text-xs">
        {meetsMinimum ? (
          <span className="font-bold text-[var(--status-compliant)]">✓ {count} صورة</span>
        ) : (
          <span className="font-bold text-[var(--status-idle)]">
            {count} من {minimumPhotos} صورة مطلوبة
          </span>
        )}
      </div>

      {canEdit ? (
        <div>
          <input
            ref={inputRef}
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            className="hidden"
            multiple
            onChange={(event) => void handleFiles(event.target.files)}
            type="file"
          />
          <button
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--primary)] px-4 py-4 text-base font-bold text-[var(--primary-foreground)] disabled:opacity-50"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <span className="text-xl">📷</span>
            {isUploading ? `جاري الرفع... ${progress.completed}/${progress.total}` : "إضافة صور"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
