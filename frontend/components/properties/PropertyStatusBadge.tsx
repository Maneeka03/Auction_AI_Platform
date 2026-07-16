import type { PropertyStatus } from "@/types/property";

const styles: Record<PropertyStatus, string> = {
  available: "bg-success-500/10 text-success-500",
  pending: "bg-amber-500/10 text-amber-600",
  sold: "bg-neutral-100 text-neutral-500",
};

const labels: Record<PropertyStatus, string> = {
  available: "Available",
  pending: "Pending",
  sold: "Sold",
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
}