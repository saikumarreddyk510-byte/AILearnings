import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { applyMigrationsToTestDb, cleanupTestDb } from "../../helpers/test-db";
import type { db as DbClient } from "@/lib/db";
import type {
  createSearchProfileForUser as CreateFn,
  deleteSearchProfileForUser as DeleteFn,
  getSearchProfileByIdForUser as GetFn,
  updateSearchProfileForUser as UpdateFn,
} from "@/server/data/search-profiles";
import type { SearchProfileInput } from "@/lib/jobs/schemas";

const TEST_DB_PATH = "./prisma/test-search-profile-ownership.db";
process.env.DATABASE_URL = `file:${TEST_DB_PATH}`;

const PROFILE_INPUT: SearchProfileInput = {
  name: "Backend roles",
  targetRoleTitles: ["Backend Engineer"],
  alternateRoleTitles: [],
  requiredSkills: [],
  optionalSkills: [],
  locations: [],
  workplaceTypes: [],
  employmentTypes: [],
  preferredIndustries: [],
  excludedCompanies: [],
  requiredKeywords: [],
  excludedKeywords: [],
  sponsorshipRequired: false,
  searchFrequency: "DAILY",
};

describe("row-level ownership: SearchProfile", () => {
  let db: typeof DbClient;
  let createSearchProfileForUser: typeof CreateFn;
  let getSearchProfileByIdForUser: typeof GetFn;
  let updateSearchProfileForUser: typeof UpdateFn;
  let deleteSearchProfileForUser: typeof DeleteFn;

  let userAId: string;
  let userBId: string;
  let profileId: string;

  beforeAll(async () => {
    cleanupTestDb(TEST_DB_PATH);
    applyMigrationsToTestDb(TEST_DB_PATH);

    ({ db } = await import("@/lib/db"));
    ({
      createSearchProfileForUser,
      getSearchProfileByIdForUser,
      updateSearchProfileForUser,
      deleteSearchProfileForUser,
    } = await import("@/server/data/search-profiles"));

    const userA = await db.user.create({
      data: { email: "sp-owner-a@example.com", passwordHash: "not-a-real-hash" },
    });
    const userB = await db.user.create({
      data: { email: "sp-owner-b@example.com", passwordHash: "not-a-real-hash" },
    });
    userAId = userA.id;
    userBId = userB.id;

    const profile = await createSearchProfileForUser(userAId, PROFILE_INPUT);
    profileId = profile.id;
  });

  afterAll(async () => {
    await db.$disconnect();
    cleanupTestDb(TEST_DB_PATH);
  });

  it("returns the profile to its owner", async () => {
    const profile = await getSearchProfileByIdForUser(profileId, userAId);
    expect(profile?.id).toBe(profileId);
  });

  it("returns null for a non-owner", async () => {
    const profile = await getSearchProfileByIdForUser(profileId, userBId);
    expect(profile).toBeNull();
  });

  it("refuses to update another user's profile", async () => {
    const success = await updateSearchProfileForUser(profileId, userBId, {
      ...PROFILE_INPUT,
      name: "Hijacked",
    });
    expect(success).toBe(false);

    const unchanged = await getSearchProfileByIdForUser(profileId, userAId);
    expect(unchanged?.name).toBe("Backend roles");
  });

  it("refuses to delete another user's profile", async () => {
    const success = await deleteSearchProfileForUser(profileId, userBId);
    expect(success).toBe(false);

    const stillThere = await getSearchProfileByIdForUser(profileId, userAId);
    expect(stillThere).not.toBeNull();
  });

  it("allows the owner to update and delete their own profile", async () => {
    const updated = await updateSearchProfileForUser(profileId, userAId, {
      ...PROFILE_INPUT,
      name: "Updated name",
    });
    expect(updated).toBe(true);

    const deleted = await deleteSearchProfileForUser(profileId, userAId);
    expect(deleted).toBe(true);

    const gone = await getSearchProfileByIdForUser(profileId, userAId);
    expect(gone).toBeNull();
  });
});
