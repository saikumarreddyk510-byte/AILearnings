import { expect, test } from "@playwright/test";

test("visiting the application page directly for a job with no approved tailored résumé shows the eligibility explainer", async ({
  page,
}) => {
  const email = `app-e2e-${Date.now()}@example.com`;
  const jobTitle = `App E2E Role ${Date.now()}`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Application Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/jobs/new");
  await page.getByLabel("Company").fill("Acme E2E Corp");
  await page.getByLabel("Title").fill(jobTitle);
  await page.getByLabel("Original posting URL").fill("https://example.com/app-e2e-job");
  await page.getByLabel("Job description").fill("A role added to test the application tracker.");
  await page.getByRole("button", { name: "Add job" }).click();
  await expect(page).toHaveURL(/\/jobs\/[^/]+/);

  await expect(page.getByText("Apply to this job")).toBeVisible();
  await expect(
    page.getByText("Approve your tailored résumé above before starting an application.")
  ).toBeVisible();

  const jobUrl = page.url();
  const jobId = jobUrl.split("/jobs/")[1];
  await page.goto(`/applications/${jobId}`);

  await expect(page.getByText("Not ready yet")).toBeVisible();
  await expect(page.getByText(/approved tailored résumé for this job/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Start application" })).toBeVisible();
});

test("the application tracker shows its empty state with zero applications", async ({ page }) => {
  const email = `app-e2e-tracker-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Tracker Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/applications");
  await expect(page.getByText("No applications yet")).toBeVisible();
});
