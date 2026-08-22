import { describe, expect, it } from "vitest";

import {
  guidedNeedPublishingEnabled,
  guidedServicePublishingEnabled,
  publishingV2ReadEnabled,
  publishingV2WriteEnabled,
  publicMarketplaceV2Enabled,
  conversationsV2Enabled,
  profileDefaultsV2Enabled,
  boardingCapacityEnabled,
  emailOutboxEnabled,
} from "./publishing-v2";

describe("publishing V2 feature flags", () => {
  it("fails closed before the V2 schema is available", () => {
    const env = {};
    expect(publishingV2ReadEnabled(env)).toBe(false);
    expect(publishingV2WriteEnabled(env)).toBe(false);
    expect(guidedNeedPublishingEnabled(env)).toBe(false);
    expect(guidedServicePublishingEnabled(env)).toBe(false);
  });

  it("allows rollback to read existing V2 data while all new writes stay closed", () => {
    const env = { FEATURE_PUBLISHING_V2_READ: "true" };
    expect(publishingV2ReadEnabled(env)).toBe(true);
    expect(publishingV2WriteEnabled(env)).toBe(false);
    expect(guidedNeedPublishingEnabled(env)).toBe(false);
    expect(guidedServicePublishingEnabled(env)).toBe(false);
  });

  it("supports independent guided need and service entry rollback", () => {
    const env = {
      FEATURE_PUBLISHING_V2: "true",
      FEATURE_GUIDED_NEED_PUBLISH: "false",
      FEATURE_GUIDED_SERVICE_PUBLISH: "true",
    };
    expect(publishingV2ReadEnabled(env)).toBe(true);
    expect(publishingV2WriteEnabled(env)).toBe(true);
    expect(guidedNeedPublishingEnabled(env)).toBe(false);
    expect(guidedServicePublishingEnabled(env)).toBe(true);
  });

  it("opens the public marketplace only when V2 reads and its own flag are enabled", () => {
    expect(publicMarketplaceV2Enabled({ FEATURE_PUBLIC_MARKETPLACE_V2: "true" })).toBe(false);
    expect(publicMarketplaceV2Enabled({
      FEATURE_PUBLISHING_V2_READ: "true",
      FEATURE_PUBLIC_MARKETPLACE_V2: "true",
    })).toBe(true);
  });

  it("keeps the supporting cutover slices independently switchable", () => {
    const env = {
      FEATURE_CONVERSATIONS_V2: "true",
      FEATURE_PROFILE_DEFAULTS_V2: "true",
      FEATURE_BOARDING_CAPACITY: "true",
      FEATURE_EMAIL_OUTBOX: "true",
    };
    expect(conversationsV2Enabled(env)).toBe(true);
    expect(profileDefaultsV2Enabled(env)).toBe(true);
    expect(boardingCapacityEnabled(env)).toBe(true);
    expect(emailOutboxEnabled(env)).toBe(true);
    expect(emailOutboxEnabled({ ...env, FEATURE_EMAIL_OUTBOX: "false" })).toBe(false);
  });
});
