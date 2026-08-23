import { GuidedNeedFlow } from "@/modules/need-publishing/client";
import { guidedNeedPublishingEnabled } from "@/server/feature-flags/publishing-v2";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validationProfileCookie, validationProfileEnabled } from "@/server/validation/profile-session";
import { createNeedPublishingContinuationToken } from "@/modules/need-publishing/server/continuation";

export default function CreateNeedPage() {
  if (!guidedNeedPublishingEnabled()) redirect("/dashboard/needs/new");
  const validationCookie = cookies().get(validationProfileCookie)?.value;
  const validationProfileSession = validationProfileEnabled() && validationCookie === process.env.VALIDATION_TEST_TOKEN;
  return (
    <GuidedNeedFlow
      publishingV2Enabled
      validationProfileSession={validationProfileSession}
      needPublishingContinuationToken={createNeedPublishingContinuationToken()}
    />
  );
}
