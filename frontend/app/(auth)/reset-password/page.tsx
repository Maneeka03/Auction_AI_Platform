import { Suspense } from "react";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm
        heading="Set a new password"
        description="Choose a new password for your account."
        submitLabel="Reset password"
      />
    </Suspense>
  );
}