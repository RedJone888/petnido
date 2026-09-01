import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GuidedNeedFlow } from "@/modules/need-publishing/client";
import { NeedEditBlocked } from "../need-edit-blocked";
import {
  validationProfileCookie,
  validationProfileEnabled,
} from "@/server/validation/profile-session";
import { getServerUserContext } from "@/server/validation/server-user-context";

export default async function EditNeedPage({
  params,
}: {
  params: { id: string };
}) {
  const { userId, prisma } = await getServerUserContext();
  if (!userId) {
    redirect(`/auth/sign-in?returnTo=${encodeURIComponent(`/needs/edit/${params.id}`)}`);
  }
  const need = await prisma.needV2.findFirst({
    where: { id: params.id, ownerId: userId, archivedAt: null },
    select: { state: true },
  });
  // Do not reveal another owner's request, an archived request, or a legacy
  // state through the shared editor route.
  if (!need) redirect("/dashboard/needs");
  if (need.state === "MATCHED") return <NeedEditBlocked />;
  if (need.state !== "OPEN" && need.state !== "CLOSED") {
    redirect("/dashboard/needs");
  }
  const validationCookie = cookies().get(validationProfileCookie)?.value;
  const validationProfileSession =
    validationProfileEnabled() &&
    validationCookie === process.env.VALIDATION_TEST_TOKEN;

  return (
    <GuidedNeedFlow
      publishingV2Enabled
      validationProfileSession={validationProfileSession}
      editingNeedId={params.id}
    />
  );
}
