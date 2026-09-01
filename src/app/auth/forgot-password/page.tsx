import { ForgotPasswordPageClient } from "@/modules/auth/client/pages/forgot-password-page";
import { sanitizeReturnTo } from "@/modules/auth/return-to";

export default function ForgotPasswordPage({ searchParams }: { searchParams: { email?: string; returnTo?: string; cancelTo?: string } }) {
  return (
    <ForgotPasswordPageClient
      initialEmail={searchParams.email ?? ""}
      returnTo={sanitizeReturnTo(searchParams.returnTo, "/")}
      cancelTo={sanitizeReturnTo(searchParams.cancelTo, "/")}
    />
  );
}
