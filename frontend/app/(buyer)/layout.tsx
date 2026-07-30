import { BuyerShell } from "@/components/layout/BuyerShell";
import type { ReactNode } from "react";

export default function BuyerLayout({ children }: { children: ReactNode }) {
  return <BuyerShell>{children}</BuyerShell>;
}
