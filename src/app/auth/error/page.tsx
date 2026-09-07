import { AuthErrorPageClient } from "@/modules/auth/client/pages/auth-error-page";

export default async function AuthErrorPage(
  props: {
    searchParams: Promise<{ error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  return <AuthErrorPageClient errorCode={searchParams.error ?? "Default"} />;
}
