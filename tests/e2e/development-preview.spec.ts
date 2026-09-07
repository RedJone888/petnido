import { expect, test } from "@playwright/test";

test.setTimeout(120_000);
test.use({ actionTimeout: 30_000 });
test.beforeEach(async ({ page }) => {
  // Local development compiles route chunks on demand.
  page.setDefaultNavigationTimeout(120_000);
});

test("Japanese home keeps its original content and labels unfinished entrances", async ({ page }, testInfo) => {
  await page.goto("/ja", { waitUntil: "domcontentloaded" });
  await expect(page.locator("html")).toHaveAttribute("lang", "ja", { timeout: 30_000 });
  await expect(page.getByRole("heading", { name: "大切なペットの「いつもの暮らし」を、ご近所のペット好き同士で支え合う。", exact: true })).toBeVisible();
  await expect(page.getByRole("complementary", { name: "開発プレビュー" })).toHaveCount(0);
  await expect(page.locator("#demo-tour")).toHaveCount(0);
  await expect(page.getByRole("link", { name: /お世話のサービスを探す · 開発中/ })).toHaveAttribute("href", "/ja/services");
  await page.screenshot({ path: testInfo.outputPath("restored-home.png") });
  await page.getByRole("button", { name: "シッターとして収入を得る · 開発中", exact: true }).click();
  await expect(page.getByRole("button", { name: "Close", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(2);
});

test("knowledge routes expose an in-development page, not the unfinished library", async ({ page }) => {
  await page.goto("/ja/knowledge", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "現在開発中です", exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  await page.goto("/knowledge", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Coming soon|現在開発中です/, exact: true })).toBeVisible({ timeout: 30_000 });
});

test("the published sample has explicit currency and Japanese calendar/map labels", async ({ page }) => {
  await page.goto("/ja/care-types/home-visits/example", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("サンプル", { exact: true })).toBeVisible({ timeout: 30_000 });
  await expect(page.getByText(/JPY/).first()).toBeVisible({ timeout: 30_000 });
  await expect(page.getByRole("button", { name: "Next month", exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Previous month", exact: true })).toHaveCount(0);
});
