"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";
import type { BuyerCrmRow } from "@/types/crm";

interface BuyerDetailsDrawerProps {
  buyer: BuyerCrmRow | null;
  open: boolean;
  onClose: () => void;
}

const STATUS_BADGE = {
  active: "bg-success-500/10 text-success-500",
  pending_verification: "bg-blue-100/10 text-amber-700",
  suspended: "bg-danger-500/10 text-danger-600",
  deleted: "bg-neutral-100 text-neutral-500",
};

function initials(name: string) {
  return name
    .split(" ")
    .map((x) => x[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function BuyerDetailsDrawer({
  buyer,
  open,
  onClose,
}: BuyerDetailsDrawerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!buyer || !open) return null;

  function handleClose() {
    setVisible(false);
    setTimeout(onClose, 200);
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div
        onClick={handleClose}
        className={`absolute inset-0 bg-neutral-900/40 transition-opacity duration-200 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        className={`relative flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-200 ${
          visible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 p-5">
          <h2 className="text-lg font-semibold">
            Buyer Details
          </h2>

          <button onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">

          <div className="mb-6 flex flex-col items-center">

            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-brand-100 text-xl font-semibold text-brand-700">
              {initials(buyer.full_name)}
            </div>

            <h3 className="mt-4 text-xl font-semibold">
              {buyer.full_name}
            </h3>

            <p className="text-neutral-500">
              {buyer.email}
            </p>

            <span
              className={`mt-3 rounded-full px-3 py-1 text-xs font-medium ${
                STATUS_BADGE[buyer.status]
              }`}
            >
              {buyer.status.replace("_", " ")}
            </span>

          </div>

          <div className="space-y-5">

            <Detail
              label="Total Bids"
              value={buyer.bids}
            />

            <Detail
              label="Auctions Won"
              value={buyer.auctions_won}
            />

            <Detail
              label="Properties Bought"
              value={buyer.properties_bought}
            />

            <Detail
              label="Joined"
              value={new Date(
                buyer.created_at
              ).toLocaleDateString()}
            />

          </div>

        </div>
      </div>
    </div>
  );
}

function Detail({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
      <span className="text-sm text-neutral-500">
        {label}
      </span>

      <span className="font-medium text-neutral-900">
        {value}
      </span>
    </div>
  );
}