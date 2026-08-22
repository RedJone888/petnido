import { describe, expect, it } from "vitest";

import { buildNotificationEmail, retryDelayMilliseconds } from "./email-template";

describe("privacy-safe notification email templates", () => {
  it("renders all three languages without accepting resource titles or message bodies", () => {
    for (const locale of ["zh", "en", "ja"] as const) {
      const email = buildNotificationEmail({ type: "MESSAGE_RECEIVED", locale, baseUrl: "https://petnido.example" });
      expect(email.subject).toBeTruthy();
      expect(email.html).toContain("/dashboard/notifications");
      expect(email.html).toContain("/dashboard/settings#preferences");
      for (const forbidden of ["private message", "35.681236", "139.767125", "floor 8", "medical diagnosis"]) {
        expect(JSON.stringify(email)).not.toContain(forbidden);
      }
    }
  });

  it("uses bounded exponential retry delays", () => {
    expect(retryDelayMilliseconds(1)).toBe(60_000);
    expect(retryDelayMilliseconds(2)).toBe(120_000);
    expect(retryDelayMilliseconds(99)).toBe(86_400_000);
  });
});
