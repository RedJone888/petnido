import { describe, expect, it, vi } from "vitest";

import { consumePostPublishEmailPrompt } from "./email-preference";

describe("post-publish email prompt", () => {
  it("creates a default-off preference without silently subscribing the user", async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ email: "owner@example.com", emailVerified: new Date() }) },
      notificationPreference: {
        findUnique: vi.fn()
          .mockResolvedValueOnce(null)
          .mockResolvedValueOnce({ id: "preference-1", emailInstant: false, emailPromptedAt: new Date() }),
        create: vi.fn().mockResolvedValue({ id: "preference-1" }),
        updateMany: vi.fn(),
      },
    };
    await expect(consumePostPublishEmailPrompt(prisma as never, "owner")).resolves.toEqual({ shouldPrompt: false, emailEligible: true });
    await expect(consumePostPublishEmailPrompt(prisma as never, "owner")).resolves.toEqual({ shouldPrompt: false, emailEligible: true });
    expect(prisma.notificationPreference.create).toHaveBeenCalledOnce();
    expect(prisma.notificationPreference.create).toHaveBeenCalledWith({ data: expect.objectContaining({ emailInstant: false }) });
  });

  it("reports that an unverified address cannot enable delivery", async () => {
    const prisma = {
      user: { findUnique: vi.fn().mockResolvedValue({ email: "owner@example.com", emailVerified: null }) },
      notificationPreference: { findUnique: vi.fn().mockResolvedValue({ id: "preference-1", emailInstant: false, emailPromptedAt: null }) },
    };
    await expect(consumePostPublishEmailPrompt(prisma as never, "owner")).resolves.toEqual({ shouldPrompt: false, emailEligible: false });
  });
});
