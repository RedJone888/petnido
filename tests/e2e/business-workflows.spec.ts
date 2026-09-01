import { expect, test, type Page } from "@playwright/test";

const validationToken = "petnido-local-e2e-token";

type FixtureResponse = {
  ok: true;
  publicNeedId: string;
  applicationId: string;
  bookingId: string;
  applicationConversationId: string;
};

async function establishSessionAndFixture(page: Page) {
  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await expect(page.getByText('{"ok":true}', { exact: true })).toBeVisible();
  const response = await page.request.post("/api/validation/business-flow", {
    headers: { "x-validation-token": validationToken },
  });
  expect(response.ok()).toBeTruthy();
  return (await response.json()) as FixtureResponse;
}

test("authenticated business workflows persist and follow confirmation state machines", async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  const mobile = testInfo.project.name === "mobile-chromium";
  await page.setViewportSize(
    mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 },
  );
  const consoleErrors: string[] = [];
  page.on("console", (message) => {
    if (
      message.type() === "error" &&
      !message.text().startsWith("ClientFetchError: Failed to fetch.") &&
      !message.text().startsWith("Failed to fetch RSC payload")
    ) {
      consoleErrors.push(message.text());
    }
  });

  const fixture = await establishSessionAndFixture(page);

  await page.goto(`/needs/${encodeURIComponent(fixture.publicNeedId)}`);
  await expect(
    page.getByRole("heading", { level: 1, name: "Weekend rabbit care" }),
  ).toBeVisible({ timeout: 20_000 });
  await page
    .getByRole("button", { name: "Save this request" })
    .click();
  await expect(
    page.getByRole("button", { name: "Saved to favorites" }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Saved to favorites" }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Ask a question" }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Ask about this request" }),
  ).toBeVisible();
  await page
    .getByLabel("First message")
    .fill("Are the weekend feeding times flexible?");
  await page.getByRole("button", { name: "Start conversation" }).click();
  await expect(page).toHaveURL(
    /\/dashboard\/notifications\?view=conversations&conversation=/,
    {
      timeout: 15_000,
    },
  );
  await expect(
    page
      .locator("section")
      .getByText("Are the weekend feeding times flexible?", { exact: true }),
  ).toBeVisible({ timeout: 15_000 });
  await page.goto("/dashboard/favorites");
  await expect(
    page.getByRole("heading", { level: 2, name: "Weekend rabbit care" }),
  ).toBeVisible();

  await page.goto(
    `/dashboard/notifications?view=conversations&conversation=${encodeURIComponent(fixture.applicationConversationId)}`,
  );
  const messagePanel = page.locator("section").filter({
    has: page.getByPlaceholder("Write a message (Shift + Enter for a new line)"),
  });
  await expect(
    messagePanel.getByText(
      "I can help with this request and have relevant cat-care experience.",
      { exact: true },
    ),
  ).toBeVisible();
  const composer = page.getByPlaceholder(
    "Write a message (Shift + Enter for a new line)",
  );
  await composer.fill("Thanks — I am reviewing the application now.");
  await page.getByRole("button", { name: "Send" }).click();
  await expect(composer).toHaveValue("");
  await expect(
    messagePanel.getByText("Thanks — I am reviewing the application now.", {
      exact: true,
    }),
  ).toBeVisible();
  await page.reload();
  await expect(
    messagePanel.getByText("Thanks — I am reviewing the application now.", {
      exact: true,
    }),
  ).toBeVisible();

  await page.goto("/dashboard/applications");
  const application = page
    .getByRole("article")
    .filter({ hasText: "Care for Mika's cat" });
  await expect(application.getByText("PENDING", { exact: true })).toBeVisible();
  await application.getByRole("button", { name: "Approve" }).click();
  let dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("heading", { name: "Approve this application?" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Approve", exact: true }).click();
  await expect(application.getByText("ACCEPTED", { exact: true })).toBeVisible();
  await application.getByRole("button", { name: "Cancel selection" }).click();
  dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(application.getByText("Cancelled", { exact: true })).toBeVisible();

  await page.goto("/dashboard/bookings");
  const booking = page
    .getByRole("article")
    .filter({ hasText: "Mika's home boarding" });
  await expect(booking.getByText("PENDING", { exact: true })).toBeVisible();
  await booking.getByRole("button", { name: "Confirm" }).click();
  dialog = page.getByRole("alertdialog");
  await expect(
    dialog.getByRole("heading", { name: "Confirm this booking?" }),
  ).toBeVisible();
  await dialog.getByRole("button", { name: "Confirm", exact: true }).click();
  await expect(booking.getByText("CONFIRMED", { exact: true })).toBeVisible();
  await booking.getByRole("button", { name: "Cancel" }).click();
  dialog = page.getByRole("alertdialog");
  await dialog.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(booking.getByText("Cancelled", { exact: true })).toBeVisible();

  await page.goto("/dashboard/notifications");
  await expect(
    page.getByRole("heading", { level: 1, name: "Notification center" }),
  ).toBeVisible();
  await expect(
    page.getByText("Care for Mika's cat", { exact: false }).first(),
  ).toBeVisible({ timeout: 20_000 });
  await expect(
    page.getByText("Mika's home boarding", { exact: false }).first(),
  ).toBeVisible();

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  expect(consoleErrors).toEqual([]);
});
