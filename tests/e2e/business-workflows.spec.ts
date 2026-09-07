import type { Page } from "@playwright/test";
import { expect, test } from "./fixtures";

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
  test.setTimeout(180_000);
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
    page.getByRole("heading", { level: 1, name: "Custom care｜Shinjuku, Tokyo｜1 Rabbit" }),
  ).toBeVisible({ timeout: 20_000 });
  await page
    .getByRole("button", { name: "Save request", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Saved", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Apply to help · In development" }).click();
  await expect(page.getByText("Application Feature In Development", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Got it", exact: true }).click();
  await page.goto("/dashboard/favorites");
  await expect(
    page.locator(`a[href="/needs/${encodeURIComponent(fixture.publicNeedId)}"]`).first(),
  ).toBeVisible();

  const initialReadReceipt = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/conversation.markRead") && response.ok(),
  );
  await page.goto(
    `/dashboard/messages?conversation=${encodeURIComponent(fixture.applicationConversationId)}`,
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
  await initialReadReceipt;
  const composer = page.getByPlaceholder(
    "Write a message (Shift + Enter for a new line)",
  );
  await composer.fill("Thanks — I am reviewing the application now.");
  // Reading the newly rendered message writes a receipt. Let that mutation
  // finish before reloading so navigation does not abort it.
  const sentReadReceipt = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/conversation.markRead") && response.ok(),
  );
  await page.getByRole("button", { name: "Send" }).click();
  await expect(composer).toHaveValue("");
  await expect(
    messagePanel.getByText("Thanks — I am reviewing the application now.", {
      exact: true,
    }),
  ).toBeVisible();
  await sentReadReceipt;
  const reloadedReadReceipt = page.waitForResponse((response) =>
    response.url().includes("/api/trpc/conversation.markRead") && response.ok(),
  );
  await page.reload();
  await expect(
    messagePanel.getByText("Thanks — I am reviewing the application now.", {
      exact: true,
    }),
  ).toBeVisible();

  await reloadedReadReceipt;
  await page.goto("/dashboard/applications");
  const application = page
    .getByRole("article")
    .filter({ has: page.locator(`a[href*="conversation=${fixture.applicationConversationId}"]`) });
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
  // The destructive confirmation and dismiss button both read "Cancel".
  await dialog.getByRole("button", { name: "Cancel", exact: true }).last().click();
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
  // The destructive confirmation and dismiss button both read "Cancel".
  await dialog.getByRole("button", { name: "Cancel", exact: true }).last().click();
  await expect(booking.getByText("Cancelled", { exact: true })).toBeVisible();

  await page.goto(`/dashboard/messages?conversation=${encodeURIComponent(fixture.applicationConversationId)}`);
  await expect(page.getByRole("heading", { level: 1, name: "Messages", exact: true })).toBeVisible();
  await expect(messagePanel.getByText("Thanks — I am reviewing the application now.", { exact: true })).toBeVisible();

  const overflow = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 2);
  expect(consoleErrors).toEqual([]);
});
