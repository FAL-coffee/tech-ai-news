import { rejectTopicCandidate } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "../../../../../../lib/admin";
import { auth } from "../../../../../../lib/auth";
import { getDb } from "../../../../../../lib/db";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  await rejectTopicCandidate(db, id, session.user.id);

  return NextResponse.redirect(new URL("/admin/topics", request.url), { status: 303 });
}
