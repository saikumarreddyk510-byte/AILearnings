-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserPreference" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "salaryCurrency" TEXT NOT NULL DEFAULT 'USD',
    "notifyByEmail" BOOLEAN NOT NULL DEFAULT true,
    "defaultSearchRadiusKm" INTEGER,
    "extra" JSONB,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "MasterResume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "originalFileName" TEXT NOT NULL,
    "originalMimeType" TEXT NOT NULL,
    "originalFileData" BLOB NOT NULL,
    "extractedText" TEXT,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "MasterResume_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResumeFact" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterResumeId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "ResumeFact_masterResumeId_fkey" FOREIGN KEY ("masterResumeId") REFERENCES "MasterResume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ResumeVersion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "masterResumeId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ResumeVersion_masterResumeId_fkey" FOREIGN KEY ("masterResumeId") REFERENCES "MasterResume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SearchProfile" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "targetRoleTitles" JSONB NOT NULL,
    "alternateRoleTitles" JSONB,
    "requiredSkills" JSONB,
    "optionalSkills" JSONB,
    "locations" JSONB,
    "workplaceTypes" JSONB,
    "minSalary" INTEGER,
    "employmentTypes" JSONB,
    "experienceLevel" TEXT,
    "preferredIndustries" JSONB,
    "excludedCompanies" JSONB,
    "requiredKeywords" JSONB,
    "excludedKeywords" JSONB,
    "sponsorshipRequired" BOOLEAN NOT NULL DEFAULT false,
    "maxPostingAgeDays" INTEGER,
    "searchFrequency" TEXT NOT NULL DEFAULT 'DAILY',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SearchProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Job" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "JobRequirement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "JobRequirement_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobMatch" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "matchedRequirements" JSONB NOT NULL,
    "missingRequirements" JSONB NOT NULL,
    "transferableSkills" JSONB NOT NULL,
    "hardFilterFailures" JSONB NOT NULL,
    "concerns" JSONB NOT NULL,
    "explanation" TEXT NOT NULL,
    "aiExecutionId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "JobMatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobMatch_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "JobMatch_aiExecutionId_fkey" FOREIGN KEY ("aiExecutionId") REFERENCES "AIExecution" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "TailoredResume" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobMatchId" TEXT NOT NULL,
    "baseVersionId" TEXT NOT NULL,
    "content" JSONB NOT NULL,
    "recommendedChanges" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "TailoredResume_jobMatchId_fkey" FOREIGN KEY ("jobMatchId") REFERENCES "JobMatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TailoredResume_baseVersionId_fkey" FOREIGN KEY ("baseVersionId") REFERENCES "ResumeVersion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CoverLetter" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobMatchId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "versionNumber" INTEGER NOT NULL DEFAULT 1,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CoverLetter_jobMatchId_fkey" FOREIGN KEY ("jobMatchId") REFERENCES "JobMatch" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ReviewDecision" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tailoredResumeId" TEXT NOT NULL,
    "changePath" TEXT NOT NULL,
    "decision" TEXT NOT NULL,
    "editedText" TEXT,
    "decidedByUserId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewDecision_tailoredResumeId_fkey" FOREIGN KEY ("tailoredResumeId") REFERENCES "TailoredResume" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "tailoredResumeId" TEXT,
    "coverLetterId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "matchScoreSnapshot" INTEGER,
    "dateApplied" DATETIME,
    "followUpDate" DATETIME,
    "notes" TEXT,
    "contactInfo" JSONB,
    "interviewDates" JSONB,
    "submissionConfirmedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Application_tailoredResumeId_fkey" FOREIGN KEY ("tailoredResumeId") REFERENCES "TailoredResume" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Application_coverLetterId_fkey" FOREIGN KEY ("coverLetterId") REFERENCES "CoverLetter" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ApplicationEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "applicationId" TEXT NOT NULL,
    "fromStatus" TEXT,
    "toStatus" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ApplicationEvent_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "JobSourceConnection" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "sourceType" TEXT NOT NULL,
    "config" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "JobSourceConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AIExecution" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "promptVersion" TEXT NOT NULL,
    "inputSummary" TEXT,
    "tokenUsage" JSONB,
    "costEstimateCents" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'SUCCEEDED',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AIExecution_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "AuditEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "UserPreference_userId_key" ON "UserPreference"("userId");

-- CreateIndex
CREATE INDEX "MasterResume_userId_idx" ON "MasterResume"("userId");

-- CreateIndex
CREATE INDEX "ResumeFact_masterResumeId_idx" ON "ResumeFact"("masterResumeId");

-- CreateIndex
CREATE UNIQUE INDEX "ResumeVersion_masterResumeId_versionNumber_key" ON "ResumeVersion"("masterResumeId", "versionNumber");

-- CreateIndex
CREATE INDEX "SearchProfile_userId_idx" ON "SearchProfile"("userId");

-- CreateIndex
CREATE INDEX "Job_contentFingerprint_idx" ON "Job"("contentFingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "Job_source_sourceJobId_key" ON "Job"("source", "sourceJobId");

-- CreateIndex
CREATE INDEX "JobRequirement_jobId_idx" ON "JobRequirement"("jobId");

-- CreateIndex
CREATE INDEX "JobMatch_userId_jobId_idx" ON "JobMatch"("userId", "jobId");

-- CreateIndex
CREATE INDEX "ReviewDecision_tailoredResumeId_idx" ON "ReviewDecision"("tailoredResumeId");

-- CreateIndex
CREATE UNIQUE INDEX "Application_userId_jobId_key" ON "Application"("userId", "jobId");

-- CreateIndex
CREATE INDEX "ApplicationEvent_applicationId_idx" ON "ApplicationEvent"("applicationId");

-- CreateIndex
CREATE INDEX "JobSourceConnection_userId_idx" ON "JobSourceConnection"("userId");

-- CreateIndex
CREATE INDEX "AIExecution_userId_idx" ON "AIExecution"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_userId_idx" ON "AuditEvent"("userId");

-- CreateIndex
CREATE INDEX "AuditEvent_entityType_entityId_idx" ON "AuditEvent"("entityType", "entityId");
