import { expect, test } from "@playwright/test";

test("landing page renders and links to sign-in / register", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "AI-assisted job search"
  );
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Create account" }).first()
  ).toBeVisible();
});
