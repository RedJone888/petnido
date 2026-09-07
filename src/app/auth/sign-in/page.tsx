import { sanitizeReturnTo } from "@/modules/auth/return-to";
import { SignInPageClient } from "@/modules/auth/client/pages/sign-in-page";
import { redirect } from "next/navigation";

export default async function SignInPage(
  props: {
    searchParams: Promise<{ returnTo?: string; error?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  if (searchParams.error) {
    redirect(`/auth/error?error=${encodeURIComponent(searchParams.error)}`);
  }
  return <SignInPageClient returnTo={sanitizeReturnTo(searchParams.returnTo)} />;
}
