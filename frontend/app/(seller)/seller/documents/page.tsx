"use client";

import { FileText, Upload } from "lucide-react";

export default function DocumentsPage() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Documents</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Contracts, title deeds, and compliance documents for your listings.
        </p>
      </div>

      <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-12 text-center">
        <FileText size={40} className="mx-auto mb-4 text-neutral-300" />
        <p className="text-base font-medium text-neutral-600">No documents uploaded yet</p>
        <p className="mt-1 text-sm text-neutral-400">
          Upload title deeds, contracts, and compliance documents here.
        </p>
        <button
          type="button"
          className="mt-5 flex items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-600 mx-auto"
        >
          <Upload size={15} /> Upload Document
        </button>
        <p className="mt-4 text-xs text-neutral-400">
          Document management will be fully available in the next release.
        </p>
      </div>
    </div>
  );
}
