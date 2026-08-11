import { NextResponse } from "next/server";
import { requireUserId } from "@/server/auth/session";
import { buildAccountExportForUser, recordAccountDataExportedForUser } from "@/server/data/account";

export async function GET() {
  const userId = await requireUserId();

  const data = await buildAccountExportForUser(userId);
  await recordAccountDataExportedForUser(userId);

  const body = JSON.stringify(data, null, 2);

  return new NextResponse(body, {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="jobpilot-account-export.json"`,
    },
  });
}
