import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

type CheckboxProps = InputHTMLAttributes<HTMLInputElement>;

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={cn(
          "h-4 w-4 shrink-0 rounded border-neutral-300 text-brand-600",
          "focus:outline-none focus:ring-2 focus:ring-brand-100",
          className,
        )}
        {...props}
      />
    );
  },
);

Checkbox.displayName = "Checkbox";