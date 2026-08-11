import { expect, test } from "@playwright/test";

test("job detail page's tailoring panel prompts for a match analysis first", async ({ page }) => {
  const email = `tailor-e2e-${Date.now()}@example.com`;
  const jobTitle = `Tailor E2E Role ${Date.now()}`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Tailor Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/jobs/new");
  await page.getByLabel("Company").fill("Acme E2E Corp");
  await page.getByLabel("Title").fill(jobTitle);
  await page.getByLabel("Original posting URL").fill("https://example.com/tailor-e2e-job");
  await page.getByLabel("Job description").fill("A role added to test the tailoring panel.");
  await page.getByRole("button", { name: "Add job" }).click();
  await expect(page).toHaveURL(/\/jobs\/[^/]+/);

  await expect(page.getByText("Tailored résumé & cover letter")).toBeVisible();
  await expect(page.getByText("Analyze this job above first.")).toBeVisible();
});

test("visiting the review page for a nonexistent job match 404s", async ({ page }) => {
  const email = `tailor-e2e-404-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Tailor Tester Two");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  const response = await page.goto("/review/does-not-exist");
  expect(response?.status()).toBe(404);
});
