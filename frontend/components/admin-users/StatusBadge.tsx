import type { UserStatus } from "@/types/auth";

const styles: Record<UserStatus, string> = {
  active: "bg-success-500/10 text-success-500",
  pending_verification: "bg-amber-500/10 text-amber-600",
  suspended: "bg-danger-500/10 text-danger-600",
  deleted: "bg-neutral-100 text-neutral-500",
};

const labels: Record<UserStatus, string> = {
  active: "Active",
  pending_verification: "Pending Verification",
  suspended: "Suspended",
  deleted: "Deleted",
};

export function StatusBadge({ status }: { status: UserStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${styles[status]}`}>{labels[status]}</span>
  );
}