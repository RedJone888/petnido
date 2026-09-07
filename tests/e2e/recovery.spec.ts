import { expect, test } from "./fixtures";

const validationToken = "petnido-local-e2e-token";
const needDraftStorageKey = "petnido:need-draft:v3";

test("damaged local drafts require explicit discard and do not overwrite server state", async ({
  page,
}) => {
  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await page.evaluate(
    ({ key }) => {
      window.localStorage.setItem("lang", "en");
      window.localStorage.setItem(key, "{not-valid-json");
    },
    { key: needDraftStorageKey },
  );
  await page.goto("/needs/create");

  const damagedDialog = page.getByRole("dialog", {
    name: "This draft cannot be restored safely",
  });
  await expect(damagedDialog).toBeVisible();
  await damagedDialog
    .getByRole("button", {
      name: "Discard damaged local draft and start over",
    })
    .click();
  await expect
    .poll(() =>
      page.evaluate((key) => window.localStorage.getItem(key), needDraftStorageKey),
    )
    .toBeNull();

  await expect(
    page
      .getByRole("heading", { name: "Continue your care request?" })
      .or(
        page.getByRole("heading", {
          level: 1,
          name: "What kind of care do you need?",
        }),
      ),
  ).toBeVisible();
});

test("message list exposes a retry action after a network failure", async ({
  page,
}) => {
  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  const clearBusinessFixture = await page.request.delete(
    `/api/validation/business-flow?token=${encodeURIComponent(validationToken)}`,
  );
  expect(clearBusinessFixture.ok()).toBeTruthy();
  const failureEndpoint = `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`;
  const enableFailure = await page.request.post(failureEndpoint, {
    data: { action: "setConversationFailure" },
  });
  expect(enableFailure.ok()).toBeTruthy();
  await page.goto("/dashboard/messages");
  await expect(
    page.getByRole("heading", { name: "Network or service unavailable" }),
  ).toBeVisible({ timeout: 20_000 });

  const clearFailure = await page.request.post(failureEndpoint, {
    data: { action: "clearFailure" },
  });
  expect(clearFailure.ok()).toBeTruthy();
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByText("No messages yet", { exact: true })).toBeVisible();
});

test("stale tabs show a draft revision conflict instead of overwriting newer work", async ({
  page,
  context,
}) => {
  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await page.goto("/validation/publishing-draft");
  await page.getByRole("button", { name: "Create server draft" }).click();
  await expect(page).toHaveURL(/\?draft=/);
  const draftUrl = page.url();

  const stalePage = await context.newPage();
  await stalePage.goto(draftUrl);
  await expect(stalePage.getByRole("status")).toContainText("Draft saved");

  await page.getByLabel("Request description").fill("Newer title");
  await page.getByRole("button", { name: "Save this step" }).click();
  await expect(page.getByText(/revision 1$/)).toBeVisible();

  await stalePage.getByLabel("Request description").fill("Stale title");
  await stalePage.getByRole("button", { name: "Save this step" }).click();
  await expect(stalePage.getByRole("status")).toContainText(
    "A newer draft exists. Reload before continuing.",
  );
  await stalePage.close();
});
