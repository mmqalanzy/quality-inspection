export async function createThumbnail(file: File, maxSize = 300): Promise<File> {
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) {
    return file;
  }

  let { width, height } = bitmap;

  if (width > maxSize || height > maxSize) {
    const ratio = Math.min(maxSize / width, maxSize / height);
    width = Math.round(width * ratio);
    height = Math.round(height * ratio);
  }

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    bitmap.close?.();
    return file;
  }

  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, "image/jpeg", 0.8);
  });

  if (!blob) {
    return file;
  }

  const name = file.name.replace(/\.[^.]+$/, "");
  return new File([blob], `${name}-thumb.jpg`, { type: "image/jpeg" });
}
