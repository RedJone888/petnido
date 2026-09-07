import { describe, expect, it } from "vitest";
import { messages } from "@/i18n/messages";
import { getNeedPublishingMessages } from "@/modules/need-publishing/i18n/messages";

describe("care type terminology", () => {
  it("uses the publishing step titles in request and service mode labels", () => {
    for (const lang of ["en", "zh", "ja"] as const) {
      const titles = getNeedPublishingMessages(lang).needPublishing.careTypes;
      for (const [mode, care] of [["HOME_VISIT", "visit"], ["BOARDING", "boarding"], ["CUSTOM", "custom"]] as const) {
        expect(messages[lang].core.modes[mode]).toBe(titles[care].title);
        expect(messages[lang].core.servicePublishing.modes[mode]).toBe(titles[care].title);
      }
    }
  });
});
