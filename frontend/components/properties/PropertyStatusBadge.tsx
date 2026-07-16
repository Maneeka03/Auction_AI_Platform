import type { PropertyStatus } from "@/types/property";

const styles: Record<PropertyStatus, string> = {
  draft: "bg-neutral-100 text-neutral-500",
  published: "bg-success-500/10 text-success-500",
  sold: "bg-brand-500/10 text-brand-600",
};

const labels: Record<PropertyStatus, string> = {
  draft: "Draft",
  published: "Published",
  sold: "Sold",
};

export function PropertyStatusBadge({ status }: { status: PropertyStatus }) {
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>;
}