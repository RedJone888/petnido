import { expect, test, type Page } from "@playwright/test";

const validationToken = "petnido-local-e2e-token";

async function expectNoHorizontalOverflow(page: Page) {
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          document.documentElement.scrollWidth -
          document.documentElement.clientWidth,
      ),
    )
    .toBeLessThanOrEqual(2);
}

async function startFreshIfDraftDialogAppears(
  page: Page,
  buttonName: string,
) {
  const dialog = page.getByRole("dialog");
  for (let attempt = 0; attempt < 30; attempt += 1) {
    if (await dialog.isVisible().catch(() => false)) {
      await dialog.getByRole("button", { name: buttonName }).click();
      return;
    }
    await page.waitForTimeout(100);
  }
}

test("Chinese and Japanese public discovery routes render their own language", async ({
  page,
}) => {
  await page.goto("/zh/needs");
  await expect(page.getByText("宠物照护需求")).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expect(page.getByRole("region", { name: "需求筛选" })).toBeVisible();
  await expect(page.getByText("无法加载需求，请检查筛选条件后重试。")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);

  await page.goto("/ja/services");
  await expect(
    page.getByRole("heading", { name: "ペットケアサービスを探す" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expect(
    page.getByRole("region", { name: "依頼の絞り込み" }),
  ).toBeVisible();
  await expect(page.getByText("サービスを読み込めませんでした。")).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test("authenticated request and service publishing honor persisted UI languages", async ({
  page,
}) => {
  await page.goto(
    `/api/validation/profile-session?token=${encodeURIComponent(validationToken)}`,
  );
  await page.evaluate(() => window.localStorage.setItem("lang", "zh"));
  await page.goto("/needs/create");
  await startFreshIfDraftDialogAppears(page, "重新开始");
  await expect(
    page.getByRole("heading", { level: 1, name: "你需要哪种照护？" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "zh");
  await expectNoHorizontalOverflow(page);

  await page.evaluate(() => window.localStorage.setItem("lang", "ja"));
  await page.goto("/dashboard/serviceprofile/services/new");
  await startFreshIfDraftDialogAppears(page, "最初から");
  await expect(
    page.getByRole("heading", { level: 1, name: "サービスの種類" }),
  ).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "ja");
  await expectNoHorizontalOverflow(page);
});
