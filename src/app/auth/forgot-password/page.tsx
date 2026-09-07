import { ForgotPasswordPageClient } from "@/modules/auth/client/pages/forgot-password-page";
import { sanitizeReturnTo } from "@/modules/auth/return-to";

export default async function ForgotPasswordPage(
  props: { searchParams: Promise<{ email?: string; returnTo?: string; cancelTo?: string }> }
) {
  const searchParams = await props.searchParams;
  return (
    <ForgotPasswordPageClient
      initialEmail={searchParams.email ?? ""}
      returnTo={sanitizeReturnTo(searchParams.returnTo, "/")}
      cancelTo={sanitizeReturnTo(searchParams.cancelTo, "/")}
    />
  );
}
