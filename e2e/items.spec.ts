import { test, expect } from "@playwright/test";

test("authenticated user can open create page and fill item form", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("access_token", "access-token");
    localStorage.setItem("refresh_token", "refresh-token");
  });

  await page.route("**/api/**", async (route) => {
    const url = route.request().url();

    if (url.includes("/auth/refresh")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          access_token: "access-token",
          refresh_token: "refresh-token",
          token_type: "bearer",
        }),
      });
      return;
    }

    if (url.includes("/auth/me")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          id: 1,
          email: "user@test.com",
          name: "User",
          surname: "Test",
          role: "user",
          is_banned: false,
        }),
      });
      return;
    }

    if (url.includes("/search/similar-by-image")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          matches: [],
        }),
      });
      return;
    }

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

  await page.goto("/create");

  await expect(page.getByRole("button", { name: /Потерял/i })).toBeVisible();

  await page.getByRole("button", { name: /Потерял/i }).click();

  await page.setInputFiles('input[type="file"]', {
    name: "test.jpg",
    mimeType: "image/jpeg",
    buffer: Buffer.from([255, 216, 255, 224, 0, 16, 74, 70, 73, 70]),
  });

  await page.locator("form input").nth(1).fill("Lost backpack");
  await page.locator("form textarea").fill("Black backpack near campus");

  await page.locator("form select").nth(0).selectOption("electronics");
  await page.locator("form select").nth(1).selectOption("A-101");

  await expect(page.locator('form button[type="submit"]')).toBeEnabled();
});