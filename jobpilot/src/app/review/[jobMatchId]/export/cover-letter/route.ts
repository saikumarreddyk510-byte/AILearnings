import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth/session";
import { getLatestCoverLetterForJobMatch } from "@/server/data/cover-letters";
import { buildCoverLetterDocx } from "@/lib/documents/cover-letter-docx-export";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/review/[jobMatchId]/export/cover-letter">
) {
  const userId = await requireUserId();
  const { jobMatchId } = await ctx.params;

  const coverLetter = await getLatestCoverLetterForJobMatch(jobMatchId, userId);
  if (!coverLetter || coverLetter.status !== "APPROVED") {
    return new NextResponse("Not found", { status: 404 });
  }

  const buffer = await buildCoverLetterDocx(coverLetter.content);

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename*=UTF-8''cover-letter.docx`,
      "Content-Length": String(buffer.length),
    },
  });
}
