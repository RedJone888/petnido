import { notFound } from "next/navigation";

import { validationProfileEnabled } from "@/server/validation/profile-session";
import { PublishingDraftDemo } from "./publishing-draft-demo";

export default function ValidationPublishingDraftPage() {
  if (
    !validationProfileEnabled() ||
    process.env.FEATURE_PUBLISHING_V2 !== "true"
  ) {
    notFound();
  }
  return <PublishingDraftDemo />;
}
