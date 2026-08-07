"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { Upload, X, Loader2 } from "lucide-react";
import { uploadImage } from "@/lib/utils/uploadImage";
import { resolveMinioUrl } from "@/lib/utils/resolveMinioUrl";
import { addPropertyImage, removePropertyImage } from "@/lib/api/properties";
import type { PropertyImage } from "@/types/property";

interface Props {
  propertyId: string;
  accessToken: string;
  images: PropertyImage[];
  onChange: (images: PropertyImage[]) => void;
}

export default function PropertyGalleryUploader({
  propertyId,
  accessToken,
  images,
  onChange,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setError(null);

    try {
      // Uploaded and attached one at a time — one bad file shouldn't lose progress on the rest.
      let current = images;
      for (const file of Array.from(fileList)) {
        const publicUrl = await uploadImage(accessToken, file, "property");
        const updated = await addPropertyImage(
          accessToken,
          propertyId,
          publicUrl,
        );
        current = updated.images;
        onChange(current);
      }
      toast.success("Images uploaded successfully");
    } catch {
      setError("One or more photos failed to upload. Try again.");
      toast.error("One or more photos failed to upload. Try again.");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function handleRemove(imageId: string) {
    try {
      const updated = await removePropertyImage(
        accessToken,
        propertyId,
        imageId,
      );
      onChange(updated.images);
      toast.success("Image removed successfully");
    } catch {
      setError("Failed to remove that photo. Try again.");
      toast.error("Failed to remove that photo. Try again.");
    }
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-neutral-700">
        Gallery ({images.length} photo{images.length === 1 ? "" : "s"})
      </label>

      {images.length > 0 && (
        <div className="mb-3 grid grid-cols-3 gap-3">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative h-24 overflow-hidden rounded-lg bg-neutral-100"
            >
              <Image
                src={resolveMinioUrl(img.image_url)!}
                alt=""
                fill
                className="object-contain"
                unoptimized
              />
              <button
                type="button"
                onClick={() => handleRemove(img.id)}
                aria-label="Remove photo"
                className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
              >
                <X size={13} />
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-neutral-300 py-4 text-sm font-medium text-neutral-600 transition hover:border-brand-400 hover:text-brand-600 disabled:opacity-50"
      >
        {uploading ? (
          <>
            <Loader2 size={16} className="animate-spin" /> Uploading...
          </>
        ) : (
          <>
            <Upload size={16} /> Add Photos
          </>
        )}
      </button>

      {error && <p className="mt-2 text-xs text-danger-600">{error}</p>}
    </div>
  );
}
