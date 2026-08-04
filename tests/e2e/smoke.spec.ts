import { expect, test } from "@playwright/test";

test("public home renders without authentication", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/PetNido/i);
  await expect(page.locator("body")).toBeVisible();
});
