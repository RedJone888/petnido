import { randomUUID } from "node:crypto";

import { expect, test, type APIRequestContext } from "@playwright/test";

const headers = { "x-validation-token": "petnido-local-e2e-token" };

async function reset(request: APIRequestContext) {
  const response = await request.post("/api/validation/vertical-slice", {
    headers,
    data: { action: "reset" },
  });
  const responseText = await response.text();
  expect(response.status(), responseText).toBe(200);
  return JSON.parse(responseText) as { ownerId: string; petId: string; serviceId: string };
}

test("published need is visible before endsAt and absent at endsAt", async ({ page, request }) => {
  const fixture = await reset(request);
  const endsAt = "2030-01-20T00:00:00.000Z";
  const input = {
    idempotencyKey: randomUUID(),
    mode: "HOME_VISIT",
    title: "E2E fixture visit",
    startsAt: "2030-01-16T00:00:00.000Z",
    endsAt,
    timeZone: "Asia/Tokyo",
    pets: [{ source: "PROFILE", petId: fixture.petId }],
    location: { lat: 35.681236, lon: 139.767125, regionLabel: "Fixture Central", displayPrecision: "MAP_POINT" },
    budget: { kind: "FIXED", amountMinor: 5000, currency: "JPY" },
    visits: [
      {
        scheduledAt: "2030-01-16T03:00:00.000Z",
        tasks: [{ petRef: fixture.petId, taskCategory: "FEED", instructions: "Fixture task" }],
      },
    ],
    transportFee: { kind: "INCLUDED" },
  };
  const published = await request.post("/api/validation/vertical-slice", {
    headers,
    data: { action: "publish", userId: fixture.ownerId, input },
  });
  expect(published.ok()).toBe(true);

  await page.goto("/validation/vertical-slice?now=2030-01-19T23%3A59%3A59.000Z");
  await expect(page.getByText("E2E fixture visit")).toBeVisible();
  await page.goto(`/validation/vertical-slice?now=${encodeURIComponent(endsAt)}`);
  await expect(page.getByText("E2E fixture visit")).toHaveCount(0);
});

test("two concurrent boarding confirmations cannot exceed pet capacity", async ({ request }) => {
  const fixture = await reset(request);
  const base = {
    serviceId: fixture.serviceId,
    startsAt: "2030-01-16T00:00:00.000Z",
    endsAt: "2030-01-17T00:00:00.000Z",
  };
  const initial = await request.post("/api/validation/vertical-slice", {
    headers,
    data: { action: "confirmBooking", input: { ...base, petCount: 3, idempotencyKey: randomUUID() } },
  });
  expect(initial.ok()).toBe(true);

  const results = await Promise.all([
    request.post("/api/validation/vertical-slice", {
      headers,
      data: { action: "confirmBooking", input: { ...base, petCount: 1, idempotencyKey: randomUUID() } },
    }),
    request.post("/api/validation/vertical-slice", {
      headers,
      data: { action: "confirmBooking", input: { ...base, petCount: 1, idempotencyKey: randomUUID() } },
    }),
  ]);
  expect(results.map((response) => response.status()).sort()).toEqual([200, 409]);
});
