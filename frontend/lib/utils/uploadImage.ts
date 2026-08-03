import type { UploadPurpose } from "@/types/upload";

export async function uploadImage(
  accessToken: string,
  file: File,
  purpose: UploadPurpose = "property",
): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`/api/v1/uploads/file?purpose=${encodeURIComponent(purpose)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}` },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(text || "Image upload failed. Please try again.");
  }

  const data = (await response.json()) as { url: string };
  return data.url;
}
