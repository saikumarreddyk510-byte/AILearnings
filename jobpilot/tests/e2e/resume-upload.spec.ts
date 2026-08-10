import path from "node:path";
import { expect, test } from "@playwright/test";
import { FIXTURE_MARKER } from "../fixtures/resume-fixture-marker";

test("upload a résumé PDF and see the extracted text", async ({ page }) => {
  const email = `resume-e2e-${Date.now()}@example.com`;

  await page.goto("/register");
  await page.getByLabel("Name").fill("Resume Tester");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("Password123!");
  await page.getByRole("button", { name: "Create account" }).click();

  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/resume");
  await page.setInputFiles(
    "#file",
    path.join(process.cwd(), "tests", "fixtures", "resumes", "sample.pdf")
  );
  await page.getByRole("button", { name: "Upload résumé" }).click();

  await expect(page).toHaveURL(/\/resume\/[^/]+$/);
  const value = await page.getByLabel("Extracted text").inputValue();
  expect(value).toContain(FIXTURE_MARKER);
});
