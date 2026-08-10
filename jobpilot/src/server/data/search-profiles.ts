import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";
import type { SearchProfileInput } from "@/lib/jobs/schemas";

/**
 * Strict single-owner CRUD, mirroring src/server/data/resumes.ts exactly
 * (unlike jobs.ts, SearchProfile has no shared/global rows to account for).
 */

export async function listSearchProfilesForUser(userId: string) {
  return db.searchProfile.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getSearchProfileByIdForUser(id: string, userId: string) {
  return db.searchProfile.findFirst({ where: { id, userId } });
}

function toSearchProfileData(input: SearchProfileInput) {
  return {
    name: input.name,
    targetRoleTitles: input.targetRoleTitles as Prisma.InputJsonValue,
    alternateRoleTitles: input.alternateRoleTitles as Prisma.InputJsonValue,
    requiredSkills: input.requiredSkills as Prisma.InputJsonValue,
    optionalSkills: input.optionalSkills as Prisma.InputJsonValue,
    locations: input.locations as Prisma.InputJsonValue,
    workplaceTypes: input.workplaceTypes as Prisma.InputJsonValue,
    minSalary: input.minSalary,
    employmentTypes: input.employmentTypes as Prisma.InputJsonValue,
    experienceLevel: input.experienceLevel,
    preferredIndustries: input.preferredIndustries as Prisma.InputJsonValue,
    excludedCompanies: input.excludedCompanies as Prisma.InputJsonValue,
    requiredKeywords: input.requiredKeywords as Prisma.InputJsonValue,
    excludedKeywords: input.excludedKeywords as Prisma.InputJsonValue,
    sponsorshipRequired: input.sponsorshipRequired,
    maxPostingAgeDays: input.maxPostingAgeDays,
    searchFrequency: input.searchFrequency,
  };
}

export async function createSearchProfileForUser(
  userId: string,
  input: SearchProfileInput
) {
  return db.searchProfile.create({
    data: { userId, ...toSearchProfileData(input) },
  });
}

export async function updateSearchProfileForUser(
  id: string,
  userId: string,
  input: SearchProfileInput
): Promise<boolean> {
  const result = await db.searchProfile.updateMany({
    where: { id, userId },
    data: toSearchProfileData(input),
  });
  return result.count === 1;
}

export async function deleteSearchProfileForUser(
  id: string,
  userId: string
): Promise<boolean> {
  const result = await db.searchProfile.deleteMany({ where: { id, userId } });
  return result.count === 1;
}
