import { Suspense } from "react";
import { SetPasswordForm } from "@/components/auth/SetPasswordForm";

export default function SetPasswordPage() {
  return (
    <Suspense>
      <SetPasswordForm
        heading="Welcome to the team"
        description="Set a password to activate your account."
        submitLabel="Set password"
      />
    </Suspense>
  );
}