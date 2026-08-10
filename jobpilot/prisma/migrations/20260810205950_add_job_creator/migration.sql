-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Job" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "sourceJobId" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "applicationUrl" TEXT,
    "company" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "workplaceType" TEXT,
    "salaryMin" INTEGER,
    "salaryMax" INTEGER,
    "employmentType" TEXT,
    "requiredSkills" JSONB,
    "preferredSkills" JSONB,
    "experienceRequirements" TEXT,
    "educationRequirements" TEXT,
    "sponsorshipInfo" TEXT,
    "datePosted" DATETIME,
    "dateDiscovered" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "applicationDeadline" DATETIME,
    "attribution" TEXT,
    "contentFingerprint" TEXT NOT NULL,
    "raw" JSONB,
    "createdByUserId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Job_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Job" ("applicationDeadline", "applicationUrl", "attribution", "company", "contentFingerprint", "createdAt", "dateDiscovered", "datePosted", "description", "educationRequirements", "employmentType", "experienceRequirements", "id", "location", "preferredSkills", "raw", "requiredSkills", "salaryMax", "salaryMin", "source", "sourceJobId", "sourceUrl", "sponsorshipInfo", "title", "updatedAt", "workplaceType") SELECT "applicationDeadline", "applicationUrl", "attribution", "company", "contentFingerprint", "createdAt", "dateDiscovered", "datePosted", "description", "educationRequirements", "employmentType", "experienceRequirements", "id", "location", "preferredSkills", "raw", "requiredSkills", "salaryMax", "salaryMin", "source", "sourceJobId", "sourceUrl", "sponsorshipInfo", "title", "updatedAt", "workplaceType" FROM "Job";
DROP TABLE "Job";
ALTER TABLE "new_Job" RENAME TO "Job";
CREATE INDEX "Job_contentFingerprint_idx" ON "Job"("contentFingerprint");
CREATE INDEX "Job_createdByUserId_idx" ON "Job"("createdByUserId");
CREATE UNIQUE INDEX "Job_source_sourceJobId_key" ON "Job"("source", "sourceJobId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
