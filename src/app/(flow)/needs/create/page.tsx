import { GuidedNeedFlow } from "@/modules/need-publishing/client";
import { cookies } from "next/headers";
import { validationProfileCookie, validationProfileEnabled } from "@/server/validation/profile-session";
import { createNeedPublishingContinuationToken } from "@/modules/need-publishing/server/continuation";

export default function CreateNeedPage() {
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
