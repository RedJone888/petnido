import { expect as baseExpect, test } from "@playwright/test";

const expect = baseExpect.configure({ timeout: 30_000 });
test.use({ actionTimeout: 30_000 });

const validationToken = "petnido-local-e2e-token";
const storageKey = "petnido:need-draft:v3";

test("formal need flow saves and resumes a V2 server-backed draft", async ({
  page,
}, testInfo) => {
  test.setTimeout(180_000);
  const mobile = testInfo.project.name === "mobile-chromium";
  await page.setViewportSize(
    mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  );
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("ClientFetchError: Failed to fetch.")) consoleErrors.push(message.text());
  });

  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.goto("/needs/create", { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("button", { name: /Home visits/i })).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: /Home visits/i }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved", {
    timeout: 30_000,
  });
  await expect
    .poll(async () =>
      page.evaluate((key) => {
        const value = window.localStorage.getItem(key);
        return value ? JSON.parse(value).serverDraftId : null;
      }, storageKey),
    )
    .toMatch(/^[0-9a-f-]{36}$/i);

  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { name: "Continue your care request?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume request" }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved", {
    timeout: 30_000,
  });
  await expect(
    page.getByRole("button", { name: /Home visits/i }),
  ).toHaveAttribute("aria-pressed", "true");

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  expect(consoleErrors).toEqual([]);
});

test("pet step selects saved profiles and exposes save and sync choices", async ({
  page,
}) => {
  test.setTimeout(120_000);
  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.goto("/needs/create", { waitUntil: "domcontentloaded" });
  const restart = page.getByRole("button", { name: "Start over" });
  if (await restart.isVisible().catch(() => false)) await restart.click();

  await expect(page.getByRole("button", { name: /Home visits/i })).toBeVisible({ timeout: 60_000 });
  await page.getByRole("button", { name: /Home visits/i }).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  await page.getByRole("button", { name: "Choose from your pet profile" }).click();
  await expect(page.getByRole("button", { name: /Mochi/ })).toBeVisible();
  await page.getByRole("button", { name: /Mochi/ }).click();
  await page.getByRole("button", { name: "Choose from your pet profile" }).click();

  await page.getByRole("button", { name: "Edit Mochi" }).click();
  const editDialog = page.getByRole("dialog", { name: /Edit pet/i });
  const syncProfile = editDialog.getByRole("radio", {
    name: /Sync these changes to the pet profile/i,
  });
  await expect(syncProfile).toBeChecked();
  const createProfile = editDialog.getByRole("radio", {
    name: /Add this edited version as a new pet/i,
  });
  await expect(createProfile).not.toBeChecked();
  await editDialog.getByText("Add this edited version as a new pet", { exact: true }).click();
  await expect(syncProfile).not.toBeChecked();
  await expect(createProfile).toBeChecked();
  await editDialog.getByRole("button", { name: "Close editor" }).click();

  await page.getByRole("button", { name: "Add another pet" }).click();
  const addDialog = page.getByRole("dialog", { name: /Add a pet/i });
  await expect(addDialog.getByRole("button", { name: "Save", exact: true })).toBeVisible();
  await expect(addDialog.getByRole("textbox", { name: /Name/i }).first()).toBeVisible();
});
