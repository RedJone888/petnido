import { expect, test } from "@playwright/test";

const validationToken = "petnido-local-e2e-token";
const storageKey = "petnido:need-draft:v3";

test("formal need flow saves and resumes a V2 server-backed draft", async ({
  page,
}, testInfo) => {
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
  await page.goto("/needs/create");
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.reload();

  await page.getByRole("button", { name: /Home visits/i }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved", {
    timeout: 15_000,
  });
  await expect
    .poll(async () =>
      page.evaluate((key) => {
        const value = window.localStorage.getItem(key);
        return value ? JSON.parse(value).serverDraftId : null;
      }, storageKey),
    )
    .toMatch(/^[0-9a-f-]{36}$/i);

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Continue your care request?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume request" }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved", {
    timeout: 15_000,
  });
  await expect(
    page.getByRole("button", { name: /Home visits/i }),
  ).toHaveClass(/border-\[#5d3a86\]/);

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
  test.setTimeout(90_000);
  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await page.evaluate((key) => window.localStorage.removeItem(key), storageKey);
  await page.goto("/needs/create");
  const restart = page.getByRole("button", { name: "Start fresh" });
  if (await restart.isVisible().catch(() => false)) await restart.click();

  await page.getByRole("button", { name: /Home visits/i }).click();
  await page.getByRole("button", { name: "Next" }).click();
  await page.getByRole("button", { name: "Choose from your pet profile" }).click();
  await expect(page.getByRole("button", { name: /Mochi/ })).toBeVisible();
  await page.getByRole("button", { name: /Mochi/ }).click();

  await page.getByRole("button", { name: "Edit Mochi" }).click();
  const editDialog = page.getByRole("dialog", { name: /Edit pet/i });
  const syncProfile = editDialog.getByRole("checkbox", {
    name: /Sync these changes to the pet profile/i,
  });
  await expect(syncProfile).toBeChecked();
  await syncProfile.uncheck();
  await expect(
    editDialog.getByRole("checkbox", {
      name: /Add this edited version as a new pet profile/i,
    }),
  ).not.toBeChecked();
  await editDialog.getByRole("button", { name: "Close editor" }).click();

  await page.getByRole("button", { name: "Add another pet" }).click();
  const addDialog = page.getByRole("dialog", { name: /Add a pet/i });
  await expect(
    addDialog.getByRole("checkbox", {
      name: /Save this pet to my pet profiles/i,
    }),
  ).toBeChecked();
});
