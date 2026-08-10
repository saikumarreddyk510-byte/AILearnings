/**
 * Minimal seed: one sample user, plus the shared mock-catalog jobs so
 * `/jobs` has something to browse. Extend this as later phases add
 * résumés/search profiles to seed too.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { MockJobSource } from "@/lib/job-sources/mock";
import { normalizeJobInput } from "@/lib/jobs/normalize";
import type { Prisma } from "@/generated/prisma/client";

async function seedUser() {
  const email = "demo@jobpilot.local";
  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`Seed user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash("demo-password-123", 12);
  const user = await db.user.create({
    data: { email, passwordHash, name: "Demo User" },
  });
  console.log(`Created seed user: ${user.email} (password: demo-password-123)`);
}

/** Populates the shared (createdByUserId: null) catalog from MockJobSource. */
async function seedMockJobs() {
  const mockSource = new MockJobSource();
  const results = await mockSource.searchJobs({ roleTitles: [] });

  for (const result of results) {
    const normalized = normalizeJobInput({
      company: result.company,
      title: result.title,
      description: result.description,
      sourceUrl: result.sourceUrl,
      applicationUrl: result.applicationUrl,
      location: result.location,
      workplaceType: result.workplaceType,
      datePosted: result.datePosted,
    });

    await db.job.upsert({
      where: { source_sourceJobId: { source: "MOCK", sourceJobId: result.sourceJobId } },
      create: {
        source: "MOCK",
        sourceJobId: result.sourceJobId,
        sourceUrl: normalized.sourceUrl,
        applicationUrl: normalized.applicationUrl,
        company: normalized.company,
        title: normalized.title,
        description: normalized.description,
        location: normalized.location,
        workplaceType: normalized.workplaceType,
        employmentType: normalized.employmentType,
        salaryMin: normalized.salaryMin,
        salaryMax: normalized.salaryMax,
        requiredSkills: normalized.requiredSkills as Prisma.InputJsonValue | undefined,
        preferredSkills: normalized.preferredSkills as Prisma.InputJsonValue | undefined,
        datePosted: normalized.datePosted,
        contentFingerprint: normalized.contentFingerprint,
        createdByUserId: null,
      },
      update: {
        sourceUrl: normalized.sourceUrl,
        company: normalized.company,
        title: normalized.title,
        description: normalized.description,
        contentFingerprint: normalized.contentFingerprint,
      },
    });
  }

  console.log(`Seeded ${results.length} mock catalog job(s).`);
}

async function main() {
  await seedUser();
  await seedMockJobs();
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await db.$disconnect();
  });
