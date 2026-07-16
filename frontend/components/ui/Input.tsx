import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, id, ...props }, ref) => {
    return (
      <input
        ref={ref}
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn(
          "h-11 w-full rounded-lg border bg-neutral-50 px-3 text-sm text-neutral-900 placeholder:text-neutral-400",
          "focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-100",
          "transition-colors disabled:cursor-not-allowed disabled:opacity-60",
          error ? "border-danger-500 focus:border-danger-500 focus:ring-danger-100" : "border-neutral-200",
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = "Input";