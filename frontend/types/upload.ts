export type UploadPurpose = "property" | "kyc";

export interface PresignUploadRequest {
  content_type: string;
  purpose: UploadPurpose;
}

export interface PresignUploadResponse {
  key: string;
  upload_url: string;
  content_type: string;
  expires_in: number;
}