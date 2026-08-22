type Environment = Record<string, string | undefined>;

function enabled(value: string | undefined) {
  return value === "true";
}

export function publishingV2WriteEnabled(env: Environment = process.env) {
  return enabled(env.FEATURE_PUBLISHING_V2);
}

export function publishingV2ReadEnabled(env: Environment = process.env) {
  return publishingV2WriteEnabled(env) || enabled(env.FEATURE_PUBLISHING_V2_READ);
}

export function guidedNeedPublishingEnabled(env: Environment = process.env) {
  return (
    publishingV2WriteEnabled(env) &&
    env.FEATURE_GUIDED_NEED_PUBLISH !== "false"
  );
}

export function guidedServicePublishingEnabled(env: Environment = process.env) {
  return (
    publishingV2WriteEnabled(env) &&
    env.FEATURE_GUIDED_SERVICE_PUBLISH !== "false"
  );
}

export function publicMarketplaceV2Enabled(env: Environment = process.env) {
  return publishingV2ReadEnabled(env) && enabled(env.FEATURE_PUBLIC_MARKETPLACE_V2);
}

export function conversationsV2Enabled(env: Environment = process.env) {
  return enabled(env.FEATURE_CONVERSATIONS_V2);
}

export function profileDefaultsV2Enabled(env: Environment = process.env) {
  return enabled(env.FEATURE_PROFILE_DEFAULTS_V2);
}

export function boardingCapacityEnabled(env: Environment = process.env) {
  return enabled(env.FEATURE_BOARDING_CAPACITY);
}

export function emailOutboxEnabled(env: Environment = process.env) {
  return env.FEATURE_EMAIL_OUTBOX === undefined || enabled(env.FEATURE_EMAIL_OUTBOX);
}
