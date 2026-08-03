/**
 * Converts absolute MinIO localhost URLs (stored in DB from older uploads) to
 * relative /minio/* proxy paths so they work from any device, not just localhost.
 *
 * New uploads already store /minio/... paths directly, so those pass through unchanged.
 */
export function resolveMinioUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  // Rewrite http://localhost:9000/provenix/... → /minio/provenix/...
  return url.replace(/^https?:\/\/[^/]*:9000\//, "/minio/");
}
