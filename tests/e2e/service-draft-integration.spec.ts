import { expect, test } from "@playwright/test";

const validationToken = "petnido-local-e2e-token";

test("formal service flow creates and resumes a server-backed V2 draft", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile-chromium";
  await page.setViewportSize(
    mobile ? { width: 390, height: 844 } : { width: 1024, height: 900 },
  );
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error" && !message.text().startsWith("ClientFetchError: Failed to fetch.")) consoleErrors.push(message.text());
  });

  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await page.goto("/dashboard/serviceprofile/services/new");
  const resumeDialog = page.getByRole("dialog", {
    name: "Continue your service draft?",
  });
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await resumeDialog.isVisible().catch(() => false)) {
      await resumeDialog.getByRole("button", { name: "Start fresh" }).click();
      break;
    }
    await page.waitForTimeout(100);
  }
  await expect(
    page.getByRole("heading", { level: 1, name: "Service type" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Home visits", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Draft saved", {
    timeout: 15_000,
  });

  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Service title").fill("Mochi home care");
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  const location = page.getByLabel("Service map location");
  await expect(location.locator("option")).toHaveCount(2);
  await location.selectOption({ index: 1 });
  await page.getByRole("button", { name: "Mon", exact: true }).click();
  await page.getByRole("button", { name: "Continue", exact: true }).click();
  await page.getByLabel("Currency").selectOption("USD");
  await page.getByLabel("Price label").fill("Standard visit");
  await page.getByLabel("Amount").fill("25.50");
  await page.waitForTimeout(1_200);
  await expect(page.getByRole("status")).toContainText("Draft saved", {
    timeout: 15_000,
  });

  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Continue your service draft?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Resume draft" }).click();
  await expect(page.getByLabel("Currency")).toHaveValue("USD");
  await expect(page.getByLabel("Amount")).toHaveValue("25.5");

  await page.evaluate(() => {
    document.documentElement.style.setProperty("zoom", "2");
  });
  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  expect(consoleErrors).toEqual([]);
});
