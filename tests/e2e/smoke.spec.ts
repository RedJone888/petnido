import { expect, test } from "./fixtures";

test("public home renders without authentication", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/PetNido/i);
  await expect(page.locator("body")).toBeVisible();
});

test("dashboard sign-in keeps the exact requested subpath", async ({ page }) => {
  await page.goto("/dashboard/settings?section=provider");
  await expect(page).toHaveURL(
    /\/auth\/sign-in\?returnTo=%2Fdashboard%2Fsettings%3Fsection%3Dprovider$/,
  );
  await expect(page.getByRole("heading", { name: "Sign in" })).toBeVisible();
});

test("tampered pending actions fail closed", async ({ page }) => {
  await page.goto("/auth/pending-action?token=tampered");
  await expect(page.getByRole("heading", { name: "This action link is no longer valid" })).toBeVisible();
  await expect(page.getByRole("button", { name: "This action is not available yet" })).toHaveCount(0);
});
