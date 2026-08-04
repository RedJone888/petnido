import { expect, test } from "@playwright/test";

const validationToken = "petnido-local-e2e-token";

test("real profile settings render and remain operable at required viewport", async ({
  page,
}, testInfo) => {
  const mobile = testInfo.project.name === "mobile-chromium";
  await page.setViewportSize(
    mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  );

  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await expect(page.getByText('{"ok":true}', { exact: true })).toBeVisible();
  await page.goto("/validation/profile-settings");
  await expect(page).toHaveURL(/\/validation\/profile-settings$/);
  await expect(
    page.getByRole("heading", { level: 1, name: "Settings", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Mochi", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 3, name: "Tokyo area", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByLabel("経験・自己紹介"),
  ).toHaveValue("Experienced with cats, rabbits, and medication routines.");
  await expect(
    page.getByText("Email me about new messages", { exact: true }),
  ).toBeVisible();

  const profileSectionLink = page.getByRole("link", {
    name: "Personal profile",
    exact: true,
  });
  await profileSectionLink.focus();
  await profileSectionLink.press("Enter");
  await expect(page).toHaveURL(/#account$/);

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
