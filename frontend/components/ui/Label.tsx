import { LabelHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface LabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label className={cn("mb-1.5 block text-sm font-medium text-neutral-800", className)} {...props}>
      {children}
      {required ? <span className="ml-0.5 text-danger-500">*</span> : null}
    </label>
  );
}