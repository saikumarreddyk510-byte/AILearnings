import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth/session";
import { getMasterResumeByIdForUser } from "@/server/data/resumes";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/resume/[id]/file">
) {
  const userId = await requireUserId();
  const { id } = await ctx.params;

  const resume = await getMasterResumeByIdForUser(id, userId);
  if (!resume) {
    return new NextResponse("Not found", { status: 404 });
  }

  // Encode the filename safely — it's user-controlled and could contain
  // characters that break an unescaped Content-Disposition header.
  const encodedName = encodeURIComponent(resume.originalFileName);

  return new NextResponse(new Uint8Array(resume.originalFileData), {
    status: 200,
    headers: {
      "Content-Type": resume.originalMimeType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodedName}`,
      "Content-Length": String(resume.originalFileData.length),
    },
  });
}
