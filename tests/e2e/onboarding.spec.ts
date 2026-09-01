import { expect, test, type Page } from "@playwright/test";

const validationToken = "petnido-local-e2e-token";

async function resetOnboarding(page: Page) {
  const response = await page.request.post(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
    { data: { action: "resetOnboarding" } },
  );
  expect(response.ok()).toBeTruthy();
}

async function completeBasicProfile(page: Page) {
  await expect(
    page.getByRole("heading", { name: "First, tell us about yourself" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Upload image" }),
  ).toBeVisible();
  await expect(page.getByPlaceholder("https://...")).toHaveCount(0);
  await page.getByLabel("Nickname").fill("Mika E2E");
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await expect(page).toHaveURL(/\/onboarding\/intent(?:\?|$)/, {
    timeout: 15_000,
  });
  await expect(
    page.getByRole("heading", {
      name: "What would you like to do on PetNido?",
    }),
  ).toBeVisible({ timeout: 15_000 });
}

test("first-time users can publish, offer care, or browse; returning users skip onboarding", async ({
  page,
}) => {
  test.setTimeout(180_000);
  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await page.evaluate(() => window.localStorage.setItem("lang", "en"));

  const needPublishingWarmup = await page.request.get("/needs/create");
  expect(needPublishingWarmup.ok()).toBeTruthy();
  const servicePublishingWarmup = await page.request.get(
    "/dashboard/serviceprofile/services/new",
  );
  expect(servicePublishingWarmup.ok()).toBeTruthy();

  await resetOnboarding(page);
  await page.goto("/auth/continue?returnTo=%2Fdashboard");
  await completeBasicProfile(page);
  await page.getByRole("button", { name: "Request pet care" }).click();
  await expect(page).toHaveURL(/\/needs\/create$/, { timeout: 30_000 });
  await expect(
    page.getByRole("heading", { level: 1, name: "What kind of care do you need?" }),
  ).toBeVisible();

  await resetOnboarding(page);
  await page.goto(
    "/auth/continue?returnTo=%2Fneeds%3Fsource%3Donboarding",
  );
  await completeBasicProfile(page);
  await page.getByRole("button", { name: "Look around first" }).click();
  await expect(page).toHaveURL(/\/needs\?source=onboarding$/, {
    timeout: 30_000,
  });

  await resetOnboarding(page);
  await page.goto(
    "/auth/continue?returnTo=%2Fdashboard%2Fserviceprofile%2Fservices%2Fnew",
  );
  await completeBasicProfile(page);
  await page.getByRole("button", { name: "Offer pet care" }).click();
  await expect(
    page.getByRole("heading", { name: "Turn on accepting requests?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirm and continue" }).click();
  await expect(page).toHaveURL(/\/onboarding\/provider-profile(?:\?|$)/, {
    timeout: 15_000,
  });
  await expect(
    page.getByRole("heading", {
      name: "Tell us about the care you can provide",
    }),
  ).toBeVisible({ timeout: 15_000 });
  await page
    .getByLabel("Experience and introduction")
    .fill("Experienced with calm indoor pets and medication routines.");
  await page.getByLabel("Months of experience").fill("36");
  await page.getByRole("button", { name: "Create profile" }).click();
  await expect(page).toHaveURL(/\/dashboard\/serviceprofile\/services\/new$/, {
    timeout: 30_000,
  });

  await page.goto("/auth/continue?returnTo=%2Fdashboard");
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 15_000 });
  await expect(page).not.toHaveURL(/\/onboarding\//);
});
