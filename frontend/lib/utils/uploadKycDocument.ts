import { presignUpload } from "@/lib/api/uploads";

export async function uploadKycDocument(accessToken: string, file: File): Promise<string> {
  const presigned = await presignUpload(accessToken, {
    content_type: file.type,
    purpose: "kyc",
  });

  const putResponse = await fetch(presigned.upload_url, {
    method: "PUT",
    headers: { "Content-Type": presigned.content_type },
    body: file,
  });

  if (!putResponse.ok) {
    throw new Error("Document upload failed. Please try again.");
  }

  return presigned.key;
}