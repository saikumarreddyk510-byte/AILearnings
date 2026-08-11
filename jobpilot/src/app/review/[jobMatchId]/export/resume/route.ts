import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth/session";
import { getLatestTailoredResumeForJobMatch } from "@/server/data/tailored-resumes";
import { buildResumeDocx } from "@/lib/documents/resume-docx-export";
import type { ResumeVersionSnapshotFact } from "@/lib/resume/version-snapshot";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/review/[jobMatchId]/export/resume">
) {
  const userId = await requireUserId();
  const { jobMatchId } = await ctx.params;

  const tailoredResume = await getLatestTailoredResumeForJobMatch(jobMatchId, userId);
  // Never export unreviewed/unapproved AI content (spec Core Flow step 14 —
  // export only happens after final approval).
  if (!tailoredResume || tailoredResume.status !== "APPROVED") {
    return new NextResponse("Not found", { status: 404 });
  }

  const content = tailoredResume.content as unknown as { facts: ResumeVersionSnapshotFact[] };
  const buffer = await buildResumeDocx(content);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''tailored-resume.docx`,
      "Content-Length": String(buffer.length),
    },
  });
}
