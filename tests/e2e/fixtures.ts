import { test as base, expect } from "@playwright/test";

export { expect };
export const test = base.extend<{ resetProfile: void; mapStyle: void }>({
  // Keep map rendering deterministic without a production MapTiler key or network.
  mapStyle: [async ({ context }, use) => {
    await context.route("https://api.maptiler.com/maps/**/style.json*", async (route) => {
      await route.fulfill({
        json: { version: 8, sources: {}, layers: [{ id: "background", type: "background", paint: { "background-color": "#f4f4f4" } }] },
      });
    });
    await use();
  }, { auto: true }],
  resetProfile: [async ({ request }, use) => {
    const response = await request.post(
      "/api/validation/profile-session?token=petnido-local-e2e-token",
      { data: { action: "resetProfileFixture" } },
    );
    expect(response.ok()).toBeTruthy();
    await use();
  }, { auto: true }],
});
