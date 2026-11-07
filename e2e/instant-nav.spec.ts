import { test, expect } from "@playwright/test";
import { instant } from "@next/playwright";

test.describe("instant navigation shell", () => {
  test("People shows loading shell when deferred inside instant()", async ({
    page,
  }) => {
    await page.goto("/explore", { waitUntil: "networkidle" });
    await instant(
      page,
      async () => {
        await page.getByRole("link", { name: "People" }).click();
        await expect(page).toHaveURL(/\/people/);
        await expect(
          page.getByTestId("route-loading-fallback"),
        ).toBeVisible();
      },
      { baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://127.0.0.1:3000" },
    );
    await expect(page.getByRole("heading", { name: "People" })).toBeVisible();
  });
});
