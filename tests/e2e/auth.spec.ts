import { test, expect } from "@playwright/test";

test.describe("Authentication", () => {
  test("should redirect to login page when not authenticated", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);
  });

  test("should show login form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /login/i })).toBeVisible();
    await expect(page.getByLabel(/username/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /login/i })).toBeVisible();
  });

  test("should show error with invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/username/i).fill("wronguser");
    await page.getByLabel(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /login/i }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible();
  });
});
