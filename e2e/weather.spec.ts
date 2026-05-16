import { test, expect } from "@playwright/test";

test("weather widget handles backend failure", async ({ page }) => {
  await page.route("**/api/v1/weather**", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        detail: "Weather service unavailable",
      }),
    });
  });

  await page.goto("/");

  await expect(
    page.getByText(/Погода временно недоступна/i)
  ).toBeVisible();
});