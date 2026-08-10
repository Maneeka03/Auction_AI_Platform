// "use client";

// import { FileText, Upload } from "lucide-react";
// import toast from "react-hot-toast";

// export default function DocumentsPage() {
//   return (
//     <div className="mx-auto max-w-7xl space-y-6 p-6">
//       <div>
//         <h1 className="text-2xl font-semibold text-neutral-900">Documents</h1>
//         <p className="mt-1 text-sm text-neutral-600">
//           Contracts, title deeds, and compliance documents for your listings.
//         </p>
//       </div>

//       <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
//         <FileText size={40} className="mx-auto mb-4 text-neutral-300" />
//         <p className="text-base font-medium text-neutral-600">No documents uploaded yet</p>
//         <p className="mt-1 text-sm text-neutral-400">
//           Upload title deeds, contracts, and compliance documents here.
//         </p>
//         <button
//           type="button"
//           className="mt-5 flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 mx-auto"
//         >
//           <Upload size={15} /> Upload Document
//         </button>
//         <p className="mt-4 text-xs text-neutral-400">
//           Document management will be fully available in the next release.
//         </p>
//       </div>
//     </div>
//   );
// }



"use client";

import { useEffect, useRef, useState } from "react";
import {
  CheckCircle,
  FileText,
  Loader2,
  Upload,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";

import { useAuth } from "@/lib/auth/session-context";

type KycStatus = "pending" | "approved" | "rejected";

interface KycData {
  id: string;
  user_id: string;
  status: KycStatus;
  legal_name: string;
  document_keys: string[];
  reviewed_at: string | null;
  notes: string | null;
  created_at: string;
}

const documentTypes = [
  "PAN Card",
  "Aadhaar Card",
  "Address Proof",
  "Bank Proof",
  "GST Certificate",
  "Business Registration",
  "Other",
];

const documentTypeToPrefix: Record<string, string> = {
  "PAN Card": "pan",
  "Aadhaar Card": "aadhaar",
  "Address Proof": "address-proof",
  "Bank Proof": "bank-proof",
  "GST Certificate": "gst",
  "Business Registration": "business-registration",
  Other: "other",
};

export default function DocumentsPage() {
  const { accessToken } = useAuth();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [kyc, setKyc] = useState<KycData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);

  const [legalName, setLegalName] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState("");

  /*
   * Load existing KYC submission.
   */
  useEffect(() => {
    if (!accessToken) {
      setIsLoading(false);
      return;
    }

    const loadKyc = async () => {
      try {
        const response = await fetch("/api/v1/kyc/me", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (response.status === 204) {
          setKyc(null);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => null);

          throw new Error(
            errorData?.detail ||
              errorData?.message ||
              "Failed to load KYC documents.",
          );
        }

        const data: KycData = await response.json();

        setKyc(data);
        setLegalName(data.legal_name || "");
      } catch (error) {
        console.error("Load KYC error:", error);

        toast.error(
          error instanceof Error
            ? error.message
            : "Failed to load your documents.",
        );
      } finally {
        setIsLoading(false);
      }
    };

    void loadKyc();
  }, [accessToken]);

  /*
   * Select document.
   */
  const handleFileSelect = (file?: File) => {
    if (!file) return;

    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
    ];

    if (!allowedTypes.includes(file.type)) {
      toast.error("Only PDF, JPG and PNG files are allowed.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10 MB.");
      return;
    }

    setSelectedFile(file);
  };

  /*
   * Upload document through the backend presigned URL API.
   */
  const uploadFile = async (file: File): Promise<string> => {
    if (!accessToken) {
      throw new Error("Authentication required.");
    }

    const presignResponse = await fetch("/api/v1/uploads/presign", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        content_type: file.type,
        purpose: "kyc",
      }),
    });

    if (!presignResponse.ok) {
      const errorData = await presignResponse.json().catch(() => null);

      throw new Error(
        errorData?.detail ||
          errorData?.message ||
          "Failed to prepare document upload.",
      );
    }

    const presignData: {
      key: string;
      upload_url: string;
      content_type: string;
      expires_in: number;
    } = await presignResponse.json();

    /*
     * Upload directly to MinIO using the presigned PUT URL.
     */
    const uploadResponse = await fetch(presignData.upload_url, {
      method: "PUT",
      headers: {
        "Content-Type": presignData.content_type,
      },
      body: file,
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload document to storage.");
    }

    return presignData.key;
  };

  /*
   * Submit KYC.
   */
  const handleUpload = async () => {
    if (!accessToken) {
      toast.error("Please log in again.");
      return;
    }

    const trimmedLegalName = legalName.trim();

    if (!trimmedLegalName) {
      toast.error("Please enter your legal name.");
      return;
    }

    if (trimmedLegalName.length < 2) {
      toast.error("Legal name must contain at least 2 characters.");
      return;
    }

    if (trimmedLegalName.length > 200) {
      toast.error("Legal name cannot exceed 200 characters.");
      return;
    }

    if (!documentType) {
      toast.error("Please select a document type.");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select a document.");
      return;
    }

    setIsUploading(true);

    try {
      /*
       * 1. Upload file to MinIO.
       */
      const key = await uploadFile(selectedFile);

      /*
       * 2. Prefix the key with document type.
       *
       * Example:
       * pan:kyc/550e8400-e29b-41d4-a716-446655440000.pdf
       */
      const prefix =
        documentTypeToPrefix[documentType] || "other";

      const typedKey = `${prefix}:${key}`;

      /*
       * 3. Preserve already uploaded documents.
       */
      const existingKeys = kyc?.document_keys ?? [];

      const documentKeys = [...existingKeys, typedKey];

      /*
       * 4. Submit KYC to backend.
       *
       * IMPORTANT:
       * legal_name must contain at least 2 characters because
       * backend validates it with min_length=2.
       */
      const response = await fetch("/api/v1/kyc", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          legal_name: trimmedLegalName,
          document_keys: documentKeys,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);

        /*
         * FastAPI 422 response usually looks like:
         *
         * {
         *   "detail": [
         *     {
         *       "loc": ["body", "legal_name"],
         *       "msg": "...",
         *       "type": "..."
         *     }
         *   ]
         * }
         */
        if (response.status === 422 && Array.isArray(errorData?.detail)) {
          const validationMessage =
            errorData.detail
              .map((item: { loc?: string[]; msg?: string }) => {
                const field = item.loc?.at(-1);

                if (field === "legal_name") {
                  return "Legal name is required.";
                }

                if (field === "document_keys") {
                  return "At least one document is required.";
                }

                return item.msg || "Invalid request.";
              })
              .join(" ");

          throw new Error(validationMessage);
        }

        throw new Error(
          errorData?.detail ||
            errorData?.message ||
            "Failed to submit KYC documents.",
        );
      }

      const updatedKyc: KycData = await response.json();

      setKyc(updatedKyc);
      setLegalName(updatedKyc.legal_name || "");
      setSelectedFile(null);
      setDocumentType("");

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      toast.success("Document uploaded successfully.");
    } catch (error) {
      console.error("KYC upload error:", error);

      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to upload document.",
      );
    } finally {
      setIsUploading(false);
    }
  };

  /*
   * Extract document type from typed key.
   */
  const getDocumentType = (key: string) => {
    const separatorIndex = key.indexOf(":");

    if (separatorIndex === -1) {
      return "KYC Document";
    }

    const type = key.slice(0, separatorIndex);

    const typeMap: Record<string, string> = {
      pan: "PAN Card",
      aadhaar: "Aadhaar Card",
      "address-proof": "Address Proof",
      "bank-proof": "Bank Proof",
      gst: "GST Certificate",
      "business-registration": "Business Registration",
      other: "Other",
    };

    return typeMap[type] || "KYC Document";
  };

  /*
   * Get actual MinIO key.
   */
  const getActualKey = (key: string) => {
    const separatorIndex = key.indexOf(":");

    return separatorIndex === -1
      ? key
      : key.slice(separatorIndex + 1);
  };

  /*
   * Status badge.
   */
  const getStatusBadge = (status: KycStatus) => {
    if (status === "approved") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-700">
          <CheckCircle size={13} />
          Approved
        </span>
      );
    }

    if (status === "rejected") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-700">
          <XCircle size={13} />
          Rejected
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-700">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending Review
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2
          size={28}
          className="animate-spin text-brand-500"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-neutral-900">
          Documents
        </h1>

        <p className="mt-1 text-sm text-neutral-500">
          Upload and manage your KYC and verification documents.
        </p>
      </div>

      {/* KYC Status */}
      {kyc && (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-neutral-500">
                KYC Verification Status
              </p>

              <p className="mt-1 text-base font-semibold text-neutral-900">
                {kyc.legal_name}
              </p>
            </div>

            {getStatusBadge(kyc.status)}
          </div>

          {kyc.status === "rejected" && kyc.notes && (
            <div className="mt-4 rounded-lg bg-red-50 px-4 py-3">
              <p className="text-xs font-semibold text-red-700">
                Review Notes
              </p>

              <p className="mt-1 text-sm text-red-600">
                {kyc.notes}
              </p>
            </div>
          )}

          {kyc.status === "pending" && (
            <p className="mt-3 text-sm text-amber-600">
              Your documents have been submitted and are waiting
              for review.
            </p>
          )}

          {kyc.status === "approved" && (
            <p className="mt-3 text-sm text-green-600">
              Your identity has been successfully verified.
            </p>
          )}
        </div>
      )}

      {/* Upload */}
      {kyc?.status !== "approved" && (
        <div className="rounded-xl border border-neutral-200 bg-white p-6">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-neutral-900">
              Upload KYC Document
            </h2>

            <p className="mt-1 text-sm text-neutral-500">
              Upload a document required for identity verification.
            </p>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {/* Legal Name */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Legal Name
              </label>

              <input
                type="text"
                value={legalName}
                onChange={(event) =>
                  setLegalName(event.target.value)
                }
                placeholder="Enter your legal name"
                maxLength={200}
                disabled={isUploading}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50"
              />

              <p className="mt-1 text-xs text-neutral-400">
                Enter the name exactly as shown on your document.
              </p>
            </div>

            {/* Document Type */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Document Type
              </label>

              <select
                value={documentType}
                onChange={(event) =>
                  setDocumentType(event.target.value)
                }
                disabled={isUploading}
                className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-700 outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 disabled:bg-neutral-50"
              >
                <option value="">
                  Select document type
                </option>

                {documentTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* File */}
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Document File
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                className="hidden"
                onChange={(event) =>
                  handleFileSelect(
                    event.target.files?.[0],
                  )
                }
              />

              <button
                type="button"
                disabled={isUploading}
                onClick={() =>
                  fileInputRef.current?.click()
                }
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 px-4 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Upload size={16} />

                {selectedFile
                  ? selectedFile.name
                  : "Choose document"}
              </button>
            </div>
          </div>

          {/* Selected file */}
          {selectedFile && (
            <div className="mt-4 flex items-center justify-between rounded-lg bg-neutral-50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <FileText
                  size={20}
                  className="shrink-0 text-neutral-400"
                />

                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-neutral-700">
                    {selectedFile.name}
                  </p>

                  <p className="text-xs text-neutral-400">
                    {(
                      selectedFile.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isUploading}
                onClick={() => {
                  setSelectedFile(null);

                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
                className="text-sm text-red-500 hover:text-red-600 disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}

          {/* Submit */}
          <div className="mt-5 flex justify-end">
            <button
              type="button"
              disabled={isUploading}
              onClick={() => void handleUpload()}
              className="flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload size={15} />
                  Upload Document
                </>
              )}
            </button>
          </div>

          <p className="mt-3 text-xs text-neutral-400">
            Accepted formats: PDF, JPG and PNG. Maximum file
            size: 10 MB.
          </p>
        </div>
      )}

      {/* Documents */}
      <div className="rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-neutral-900">
            My Documents
          </h2>

          <p className="mt-1 text-sm text-neutral-500">
            Documents submitted for KYC verification.
          </p>
        </div>

        {!kyc || kyc.document_keys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <FileText
              size={40}
              className="mx-auto mb-4 text-neutral-300"
            />

            <p className="text-base font-medium text-neutral-600">
              No documents uploaded yet
            </p>

            <p className="mt-1 text-sm text-neutral-400">
              Upload your KYC documents above to start the
              verification process.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {kyc.document_keys.map((key) => {
              const actualKey = getActualKey(key);
              const type = getDocumentType(key);

              return (
                <div
                  key={key}
                  className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="rounded-lg bg-neutral-100 p-2.5">
                      <FileText
                        size={20}
                        className="text-neutral-500"
                      />
                    </div>

                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-neutral-800">
                        {type}
                      </p>

                      <p className="truncate text-xs text-neutral-400">
                        {actualKey.split("/").pop()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {getStatusBadge(kyc.status)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
