import { expect, test } from "@playwright/test";

test("shows the GradeCopilot foundation page", async ({ page }) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: "Teacher-reviewed feedback, made simpler.",
    }),
  ).toBeVisible();
});

test("redirects unauthenticated teachers to sign in", async ({ page }) => {
  await page.goto("/dashboard");

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: "Welcome back" })).toBeVisible();
});
