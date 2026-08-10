import { expect, test } from "@playwright/test";

test("add a job manually and see it on the jobs list", async ({ page }) => {
  const email = `job-e2e-${Date.now()}@example.com`;
  const jobTitle = `E2E Test Role ${Date.now()}`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Job Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/jobs/new");
  await page.getByLabel("Company").fill("Acme E2E Corp");
  await page.getByLabel("Title").fill(jobTitle);
  await page.getByLabel("Original posting URL").fill("https://example.com/e2e-job");
  await page.getByLabel("Job description").fill("A role added via an end-to-end test.");
  await page.getByRole("button", { name: "Add job" }).click();

  await expect(page).toHaveURL(/\/jobs\/[^/]+/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(jobTitle);

  await page.goto("/jobs");
  await expect(page.getByText(jobTitle)).toBeVisible();
});
