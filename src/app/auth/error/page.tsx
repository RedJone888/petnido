import { AuthErrorPageClient } from "@/modules/auth/client/pages/auth-error-page";

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  return <AuthErrorPageClient errorCode={searchParams.error ?? "Default"} />;
}
