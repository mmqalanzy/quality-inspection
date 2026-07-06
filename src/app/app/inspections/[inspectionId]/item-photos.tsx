"use client";

import { useRef, useState } from "react";
import { triggerNotification } from "@/telegram/webapp";

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

export function ItemPhotoPicker({ itemId, initialPhotos, canEdit, minimumPhotos }: Props) {
  const [photos, setPhotos] = useState<Photo[]>(initialPhotos);
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const count = photos.length;
  const meetsMinimum = count >= minimumPhotos;

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (!canEdit) return;

    setUploadState("uploading");
    setMessage(`جاري رفع ${files.length} صورة...`);

    const uploaded: Photo[] = [];
    let lastError = "";

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("photo", file);

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
          lastError = result.message ?? "تعذر رفع الصورة.";
          continue;
        }

        uploaded.push(result.photo);
      } catch {
        lastError = "تعذر الاتصال بالخادم.";
      }
    }

    if (uploaded.length > 0) {
      setPhotos((prev) => [...prev, ...uploaded]);
      triggerNotification("success");
    }

    if (uploaded.length === files.length) {
      setUploadState("idle");
      setMessage("");
    } else {
      setUploadState("error");
      setMessage(lastError || "تعذر رفع بعض الصور.");
      triggerNotification("error");
    }

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
            {uploadState === "uploading" ? "جاري الرفع..." : "إضافة صور"}
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
