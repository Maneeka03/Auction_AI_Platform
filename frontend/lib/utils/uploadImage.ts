import { presignUpload } from "@/lib/api/uploads";
import type { UploadPurpose } from "@/types/upload";

const PUBLIC_BASE_URL = process.env.NEXT_PUBLIC_S3_PUBLIC_BASE_URL ?? "http://localhost:9000/provenix";

export async function uploadImage(
  accessToken: string,
  file: File,
  purpose: UploadPurpose = "property",
): Promise<string> {
  const presigned = await presignUpload(accessToken, {
    content_type: file.type,
    purpose,
  });

  const putResponse = await fetch(presigned.upload_url, {
    method: "PUT",
    headers: { "Content-Type": presigned.content_type },
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error("Image upload failed. Please try again.");
  }

  return `${PUBLIC_BASE_URL}/${presigned.key}`;
}