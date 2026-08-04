import { sanitizeReturnTo } from "@/domain/auth/return-to";
import { SignInClient } from "./sign-in-client";

export default function SignInPage({ searchParams }: { searchParams: { returnTo?: string } }) {
  return <SignInClient returnTo={sanitizeReturnTo(searchParams.returnTo)} />;
}
