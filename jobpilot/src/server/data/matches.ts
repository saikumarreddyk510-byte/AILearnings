import "server-only";
import { db } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function getLatestJobMatchForUser(jobId: string, userId: string) {
  return db.jobMatch.findFirst({
    where: { jobId, userId },
    orderBy: { createdAt: "desc" },
    include: { aiExecution: true },
  });
}

/** Ownership-checked lookup by JobMatch id, including its Job — used by Phase 5 tailoring. */
export async function getJobMatchByIdForUser(jobMatchId: string, userId: string) {
  return db.jobMatch.findFirst({
    where: { id: jobMatchId, userId },
    include: { job: true },
  });
}

export interface CreateJobMatchInput {
  score: number;
  matchedRequirements: string[];
  missingRequirements: string[];
  transferableSkills: string[];
  hardFilterFailures: string[];
  concerns: string[];
  explanation: string;
  aiExecutionId: string | null;
}

export async function createJobMatchForUser(
  userId: string,
  jobId: string,
  data: CreateJobMatchInput
) {
  return db.jobMatch.create({
    data: {
      userId,
      jobId,
      score: data.score,
      matchedRequirements: data.matchedRequirements as Prisma.InputJsonValue,
      missingRequirements: data.missingRequirements as Prisma.InputJsonValue,
      transferableSkills: data.transferableSkills as Prisma.InputJsonValue,
      hardFilterFailures: data.hardFilterFailures as Prisma.InputJsonValue,
      concerns: data.concerns as Prisma.InputJsonValue,
      explanation: data.explanation,
      aiExecutionId: data.aiExecutionId,
    },
    include: { aiExecution: true },
  });
}
