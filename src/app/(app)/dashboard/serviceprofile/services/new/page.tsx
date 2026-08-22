import { LegacyServiceNewClient } from "./legacy-service-new-client";
import { ServicePublishingV2Flow } from "./service-publishing-v2-flow";
import { guidedServicePublishingEnabled } from "@/server/feature-flags/publishing-v2";

export default function ServiceNewPage() {
  return guidedServicePublishingEnabled() ? (
    <ServicePublishingV2Flow />
  ) : (
    <LegacyServiceNewClient />
  );
}
