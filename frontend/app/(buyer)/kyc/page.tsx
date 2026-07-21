"use client";

import { CheckCircle2, Clock, FileText, Trash2, Upload, XCircle } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { BuyerTopbar } from "@/components/layout/BuyerTopbar";
import { getMyKyc, submitKyc } from "@/lib/api/kyc";
import { ApiRequestError } from "@/lib/api/client";
import { uploadKycDocument } from "@/lib/utils/uploadKycDocument";
import { useAuth } from "@/lib/auth/session-context";
import type { KycSubmission } from "@/types/kyc";

const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/avif,application/pdf";

export default function KycPage() {
  const { accessToken } = useAuth();
  const [submission, setSubmission] = useState<KycSubmission | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  const [legalName, setLegalName] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchStatus = useCallback(async () => {
    if (!accessToken) return;
    setIsLoading(true);
    try {
      const result = await getMyKyc(accessToken);
      setSubmission(result ?? null);
      if (result) setLegalName(result.legal_name);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load verification status.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    void fetchStatus();
  }, [fetchStatus]);

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    setFiles((prev) => [...prev, ...selected].slice(0, 10));
    event.target.value = "";
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (!legalName.trim()) {
      setError("Enter your full legal name.");
      return;
    }
    if (files.length === 0) {
      setError("Upload at least one identity document.");
      return;
    }
    if (!accessToken) {
      setError("You must be signed in.");
      return;
    }

    setIsSubmitting(true);
    try {
      const documentKeys: string[] = [];
      for (let i = 0; i < files.length; i += 1) {
        setUploadProgress(`Uploading document ${i + 1} of ${files.length}...`);
        const key = await uploadKycDocument(accessToken, files[i]);
        documentKeys.push(key);
      }
      setUploadProgress(null);

      const result = await submitKyc(accessToken, { legal_name: legalName, document_keys: documentKeys });
      setSubmission(result);
      setFiles([]);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Submission failed. Please try again.");
    } finally {
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  const canSubmitOrResubmit = submission === null || submission?.status === "rejected";

  return (
    <div className="min-h-screen bg-neutral-50">
      <BuyerTopbar />

      <div className="mx-auto max-w-2xl space-y-5 p-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Identity Verification</h1>
          <p className="mt-1 text-sm text-neutral-600">
            Required to bid on auctions and purchase properties directly.
          </p>
        </div>

        {isLoading ? (
          <p className="text-sm text-neutral-500">Loading...</p>
        ) : (
          <>
            {submission?.status === "approved" ? (
              <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success-500/10 text-success-500">
                  <CheckCircle2 size={20} />
                </span>
                <div>
                  <p className="font-semibold text-neutral-900">Verified</p>
                  <p className="mt-0.5 text-sm text-neutral-600">
                    Your identity was verified on {submission.reviewed_at ? new Date(submission.reviewed_at).toLocaleDateString() : "—"}. You're all set to bid and purchase.
                  </p>
                </div>
              </div>
            ) : submission?.status === "pending" ? (
              <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-white p-5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/10 text-amber-600">
                  <Clock size={20} />
                </span>
                <div>
                  <p className="font-semibold text-neutral-900">Under Review</p>
                  <p className="mt-0.5 text-sm text-neutral-600">
                    Submitted {new Date(submission.created_at).toLocaleDateString()} as{" "}
                    <span className="font-medium">{submission.legal_name}</span>. We'll notify you once it's
                    reviewed.
                  </p>
                </div>
              </div>
            ) : submission?.status === "rejected" ? (
              <div className="rounded-xl border border-danger-200 bg-white p-5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-danger-500/10 text-danger-600">
                    <XCircle size={20} />
                  </span>
                  <div>
                    <p className="font-semibold text-neutral-900">Verification Rejected</p>
                    {submission.notes ? (
                      <p className="mt-0.5 text-sm text-neutral-600">{submission.notes}</p>
                    ) : (
                      <p className="mt-0.5 text-sm text-neutral-600">Please review and resubmit below.</p>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            {canSubmitOrResubmit ? (
              <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                    Full Legal Name <span className="text-danger-500">*</span>
                  </label>
                  <input
                    value={legalName}
                    onChange={(e) => setLegalName(e.target.value)}
                    placeholder="As it appears on your ID"
                    disabled={isSubmitting}
                    className="h-11 w-full rounded-lg border border-neutral-200 bg-neutral-50 px-3 text-sm focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100 disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-neutral-800">
                    Identity Documents <span className="text-danger-500">*</span>
                  </label>
                  <p className="mb-2 text-xs text-neutral-500">
                    A government-issued photo ID (front and back, or passport). JPG, PNG, or PDF.
                  </p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    multiple
                    onChange={handleFileSelect}
                    disabled={isSubmitting}
                    className="hidden"
                  />

                  {files.length > 0 ? (
                    <ul className="mb-2 space-y-1.5">
                      {files.map((file, index) => (
                        <li
                          key={`${file.name}-${index}`}
                          className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2 text-sm"
                        >
                          <span className="flex items-center gap-2 truncate text-neutral-700">
                            <FileText size={14} className="shrink-0 text-neutral-400" />
                            <span className="truncate">{file.name}</span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeFile(index)}
                            disabled={isSubmitting}
                            aria-label={`Remove ${file.name}`}
                            className="shrink-0 text-neutral-400 hover:text-danger-600 disabled:opacity-60"
                          >
                            <Trash2 size={14} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSubmitting}
                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-300 py-3 text-sm text-neutral-500 hover:border-brand-300 hover:text-brand-600 disabled:opacity-60"
                  >
                    <Upload size={15} /> Add document
                  </button>
                </div>

                {error ? <p className="text-sm text-danger-600">{error}</p> : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-lg bg-brand-500 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:opacity-60"
                >
                  {uploadProgress ?? (isSubmitting ? "Submitting..." : "Submit for Verification")}
                </button>
              </form>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}