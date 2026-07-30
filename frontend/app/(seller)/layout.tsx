import { SellerShell } from "@/components/layout/SellerShell";
import type { ReactNode } from "react";

export default function SellerLayout({ children }: { children: ReactNode }) {
  return <SellerShell>{children}</SellerShell>;
}
