import { expect, test } from "./fixtures";

const validationToken = "petnido-local-e2e-token";

test("profile, pets and account settings remain operable on desktop and mobile", async ({ page }) => {
  await page.goto(`/api/validation/profile-session?token=${validationToken}`);
  await page.goto("/dashboard/settings");
  await expect(page).toHaveURL(/\/dashboard\/settings\/security$/);
  await expect(page.locator("#security")).toBeVisible();

  await page.goto("/dashboard/profile");
  const account = page.locator("#account");
  await expect(account.getByText("profile-e2e@petnido.invalid", { exact: true })).toBeVisible();
  await expect(account.getByText("Verified", { exact: true })).toBeVisible();
  await account.getByRole("button", { name: "Change nickname", exact: true }).click();
  await account.getByLabel("Nickname").fill("Updated Mika");
  await account.getByRole("button", { name: "Save nickname", exact: true }).click();
  await expect(account.getByText("Updated Mika", { exact: true })).toBeVisible();
  await page.reload();
  await expect(account.getByText("Updated Mika", { exact: true })).toBeVisible();

  // Exercise the actual auth procedure: malformed input is rejected before mail delivery.
  const invalidEmail = await page.request.post("/api/trpc/auth.requestEmailChange?batch=1", {
    data: { "0": { email: "not-an-email" } },
  });
  expect(await invalidEmail.json()).toMatchObject([{ error: { data: { httpStatus: 400 } } }]);
  await account.getByRole("button", { name: "Change email", exact: true }).click();
  await account.getByLabel("Email").fill("not-an-email");
  await expect(account.getByRole("alert")).toContainText("Enter a valid email address");
  await expect(account.getByRole("button", { name: "Send verification code" })).toBeDisabled();
  await account.getByLabel("Email").fill("replacement@example.com");
  await page.route("**/api/trpc/auth.requestEmailChange*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([
      { result: { data: { expiresAt: new Date(Date.now() + 600_000).toISOString(), cooldownSeconds: 60 } } },
    ]) });
  });
  await account.getByRole("button", { name: "Send verification code" }).click();
  const digits = account.locator("input[aria-label^='Verification code digit']");
  await expect(digits).toHaveCount(6);
  await expect(account.getByRole("button", { name: "Confirm email", exact: true })).toBeDisabled();
  await expect(account.getByRole("button", { name: /^Resend code \(\d+s\)$/ })).toBeDisabled();
  // An unconfirmed change must not alter the account email.
  await page.reload();
  await expect(account.getByText("profile-e2e@petnido.invalid", { exact: true })).toBeVisible();

  const addressRow = page.locator('[data-profile-row="address"]');
  await addressRow.getByRole("button", { name: "Change address", exact: true }).click();
  await addressRow.locator('button[aria-haspopup="menu"]').click();
  const address = addressRow.locator("[data-address-item]").first();
  await expect(address).toContainText("Tokyo");
  await address.getByRole("button", { name: /Delete address/ }).click();
  const confirmation = page.getByRole("alertdialog");
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(confirmation).toHaveCount(0);
  await addressRow.locator('button[aria-haspopup="menu"]').click();
  await expect(address).toBeVisible();
  await address.getByRole("button", { name: /Delete address/ }).click();
  await confirmation.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(addressRow).toContainText("No address added");
  await page.reload();
  await expect(addressRow).toContainText("No address added");

  await addressRow.getByRole("button", { name: "Change address", exact: true }).click();
  await addressRow.locator("[data-address-add]").click();
  const locationEditor = page.getByRole("dialog", { name: "Add new address" });
  await page.route("**/api/trpc/location.search*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([
      { result: { data: [{ id: "node-1", countryCode: "JP", label: "Tokyo Station", subLabel: "Chiyoda, Tokyo, Japan", lat: 35.681236, lon: 139.767125, type: "station" }] } },
    ]) });
  });
  await locationEditor.getByRole("combobox", { name: "Choose an approximate map location" }).fill("Tokyo");
  await locationEditor.getByRole("option", { name: /Tokyo Station/ }).click();
  await locationEditor.getByRole("button", { name: "Save", exact: true }).click();
  await expect(locationEditor).toHaveCount(0);
  await expect(addressRow).toContainText("Tokyo Station");
  await page.reload();
  await expect(addressRow).toContainText("Tokyo Station");

  await page.goto("/dashboard/profile/pets");
  await expect(page.getByText("Mochi", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Add a pet", exact: true }).click();
  const petDialog = page.getByRole("dialog", { name: "Add a pet" });
  await petDialog.getByRole("button", { name: "Save", exact: true }).click();
  await expect(petDialog.getByText("Name is required.", { exact: true })).toBeVisible();
  await expect(petDialog.getByText("Pet type is required.", { exact: true })).toBeVisible();
  await petDialog.getByRole("button", { name: "Close editor" }).click();
  await expect(petDialog).toHaveCount(0);

  await page.goto("/dashboard/messages");
  const emailSwitch = page.getByRole("switch", { name: "Email alerts" });
  await expect(emailSwitch).toHaveAttribute("aria-checked", "true");
  await emailSwitch.click();
  await expect(emailSwitch).toHaveAttribute("aria-checked", "false");
  // The switch updates optimistically; wait for persistence before reloading.
  await expect(emailSwitch).toBeEnabled();
  await page.reload();
  await expect(emailSwitch).toHaveAttribute("aria-checked", "false");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
});
