function enabled(value: string | undefined) {
  return value === "true";
}

export function emailOutboxEnabled(env: Record<string, string | undefined> = process.env) {
  return env.FEATURE_EMAIL_OUTBOX === undefined || enabled(env.FEATURE_EMAIL_OUTBOX);
}
