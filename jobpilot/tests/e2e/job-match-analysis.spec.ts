import { expect, test } from "@playwright/test";

test("job detail page prompts for a verified résumé before analysis", async ({ page }) => {
  const email = `match-e2e-${Date.now()}@example.com`;
  const jobTitle = `Match E2E Role ${Date.now()}`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Match Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/jobs/new");
  await page.getByLabel("Company").fill("Acme E2E Corp");
  await page.getByLabel("Title").fill(jobTitle);
  await page.getByLabel("Original posting URL").fill("https://example.com/match-e2e-job");
  await page.getByLabel("Job description").fill("A role added to test the match panel.");
  await page.getByRole("button", { name: "Add job" }).click();
  await expect(page).toHaveURL(/\/jobs\/[^/]+/);

  await expect(page.getByText("Match analysis")).toBeVisible();
  await expect(page.getByText(/verify a résumé/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: "Go verify your résumé" })
  ).toHaveAttribute("href", "/resume");
});
