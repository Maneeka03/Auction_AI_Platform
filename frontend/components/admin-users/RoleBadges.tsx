import type { UserRole } from "@/types/auth";

const roleLabels: Record<UserRole, string> = {
  super_admin: "Super Admin",
  auction_manager: "Auction Manager",
  marketing: "Marketing",
  legal: "Legal",
  finance: "Finance",
  gemologist: "Gemologist",
  executive: "Executive",
  buyer: "Buyer",
  seller: "Seller",
};

export function RoleBadges({ roles }: { roles: UserRole[] }) {
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((role) => (
        <span key={role} className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700">
          {roleLabels[role]}
        </span>
      ))}
    </div>
  );
}