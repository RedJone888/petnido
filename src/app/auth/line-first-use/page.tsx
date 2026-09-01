import { redirect } from "next/navigation";

import { sanitizeReturnTo } from "@/modules/auth/return-to";
import { LineFirstUsePageClient } from "@/modules/auth/client/pages/line-first-use-page";
import { getServerUserContext } from "@/server/validation/server-user-context";

export default async function LineFirstUsePage({ searchParams }: { searchParams: { returnTo?: string } }) {
  const { userId } = await getServerUserContext();
  if (!userId) redirect("/auth/sign-in");
  return <LineFirstUsePageClient returnTo={sanitizeReturnTo(searchParams.returnTo, "/dashboard")} />;
}
