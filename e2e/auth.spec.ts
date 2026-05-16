import { test, expect } from "@playwright/test";

test("anonymous user can see login navigation", async ({ page }) => {
  await page.route("**/api/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        items: [],
        total: 0,
        page: 1,
        page_size: 20,
      }),
    });
  });

  await page.goto("/");

  await expect(page.getByText(/Campus Lost&Found/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /Войти/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Регистрация/i })).toBeVisible();
});