import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { GuidedNeedFlow } from "../../create/guided-need-flow";
import { guidedNeedPublishingEnabled } from "@/server/feature-flags/publishing-v2";
import {
  validationProfileCookie,
  validationProfileEnabled,
} from "@/server/validation/profile-session";

export default function EditNeedPage({
  params,
}: {
  params: { id: string };
}) {
  if (!guidedNeedPublishingEnabled()) {
    redirect(`/dashboard/needs/${params.id}/edit`);
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
