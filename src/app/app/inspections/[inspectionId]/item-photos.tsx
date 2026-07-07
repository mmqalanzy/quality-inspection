"use client";

import { useRef, useState } from "react";
import { triggerNotification } from "@/telegram/webapp";
import { compressImage } from "@/lib/compress-image";

type Photo = {
  id: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  sortOrder: number;
};

type Props = {
  itemId: string;
  initialPhotos: Photo[];
  canEdit: boolean;
  minimumPhotos: number;
};

type UploadState = "idle" | "uploading" | "error";

const UPLOAD_CONCURRENCY = 3;

async function uploadSinglePhoto(itemId: string, file: File): Promise<{ photo?: Photo; error?: string }> {
  const compressed = await compressImage(file, { maxWidth: 1600, maxHeight: 1600, quality: 0.8 });

  const formData = new FormData();
  formData.append("photo", compressed);

  try {
    const response = await fetch(`/api/inspection-items/${itemId}/photos`, {
      method: "POST",
      body: formData
    });
    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      photo?: Photo;
    };

    if (!response.ok || !result.ok || !result.photo) {
      return { error: result.message ?? "تعذر رفع الصورة." };
    }

    return { photo: result.photo };
  } catch {
    return { error: "تعذر الاتصال بالخادم." };
  }
}

async function runWithConcurrency<T>(
  tasks: (() => Promise<T>)[],
  concurrency: number
): Promise<T[]> {
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
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const count = photos.length;
  const meetsMinimum = count >= minimumPhotos;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!canEdit) return;

    const fileList = Array.from(files);
    setUploadState("uploading");
    setProgress({ completed: 0, total: fileList.length });
    setMessage("");

    const uploaded: Photo[] = [];
    let lastError = "";

    const tasks = fileList.map((file) => async () => {
      const result = await uploadSinglePhoto(itemId, file);
      setProgress((prev) => ({ ...prev, completed: prev.completed + 1 }));
      return result;
    });

    const results = await runWithConcurrency(tasks, UPLOAD_CONCURRENCY);

    for (const result of results) {
      if (result.photo) {
        uploaded.push(result.photo);
      } else if (result.error) {
        lastError = result.error;
      }
    }

    if (uploaded.length > 0) {
      setPhotos((prev) => [...prev, ...uploaded]);
      triggerNotification("success");
    }

    if (uploaded.length === fileList.length) {
      setUploadState("idle");
      setMessage("");
    } else {
      setUploadState("error");
      setMessage(lastError || "تعذر رفع بعض الصور.");
      triggerNotification("error");
    }

    setProgress({ completed: 0, total: 0 });

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-3 grid gap-2">
      {photos.length > 0 ? (
        <div className="grid grid-cols-3 gap-2">
          {photos.map((photo, index) => (
            <a
              key={photo.id}
              href={`/api/evidence-photos/${photo.id}`}
              target="_blank"
              rel="noreferrer"
              className="relative block overflow-hidden rounded-lg border border-[var(--border)]"
            >
              <img
                alt={`صورة ${index + 1}`}
                src={`/api/evidence-photos/${photo.id}`}
                className="h-40 w-full object-contain"
                loading="lazy"
                decoding="async"
              />
              <span className="absolute bottom-1 right-1 rounded bg-black/60 px-1.5 py-0.5 text-xs font-bold text-white">
                {index + 1}
              </span>
            </a>
          ))}
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
            disabled={uploadState === "uploading"}
            onClick={() => inputRef.current?.click()}
            type="button"
          >
            <span className="text-xl">📷</span>
            {uploadState === "uploading"
              ? `جاري الرفع... ${progress.completed}/${progress.total}`
              : "إضافة صور"}
          </button>
        </div>
      ) : null}

      {message ? (
        <p className={`text-xs ${uploadState === "error" ? "text-[var(--status-non-compliant)]" : ""}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
