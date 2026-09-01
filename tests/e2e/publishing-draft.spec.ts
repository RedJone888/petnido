import { expect, test } from "@playwright/test";

const validationToken = "petnido-local-e2e-token";

test("shared publishing shell persists a real versioned draft", async ({ page }, testInfo) => {
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
  await page.goto("/validation/publishing-draft");
  await expect(
    page.getByRole("heading", { level: 1, name: "Create a care request" }),
  ).toBeVisible();

  await page.getByRole("button", { name: "Create server draft" }).click();
  await expect(page).toHaveURL(/\/validation\/publishing-draft\?draft=/);
  await expect(page.getByRole("status")).toContainText("Draft saved");

  await page.getByLabel("Request title").fill("Mochi's evening care");
  await page.getByRole("button", { name: "Pets" }).focus();
  await page.getByRole("button", { name: "Pets" }).press("Enter");
  await expect(page.getByRole("button", { name: "Pets" })).toHaveAttribute(
    "aria-current",
    "step",
  );
  await page.getByRole("button", { name: "Save this step" }).click();
  await expect(page.getByText(/revision 1$/)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel("Request title")).toHaveValue("Mochi's evening care");
  await expect(page.getByRole("button", { name: "Pets" })).toHaveAttribute(
    "aria-current",
    "step",
  );

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
