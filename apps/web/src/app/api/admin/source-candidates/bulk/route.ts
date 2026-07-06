import { approveSourceCandidate, rejectSourceCandidate } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "../../../../../lib/admin";
import { auth } from "../../../../../lib/auth";
import { getDb } from "../../../../../lib/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const ids = Array.isArray(body.ids) ? body.ids.filter((id: unknown): id is string => typeof id === "string") : [];
  const action = body.action === "approve" ? "approve" : body.action === "reject" ? "reject" : null;
  if (!action || ids.length === 0) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 });
  }

  const db = getDb();
  let succeeded = 0;
  const errors: { id: string; message: string }[] = [];

  for (const id of ids) {
    try {
      if (action === "approve") {
        await approveSourceCandidate(db, id, session.user.id);
      } else {
        await rejectSourceCandidate(db, id, session.user.id);
      }
      succeeded += 1;
    } catch (err) {
      errors.push({ id, message: (err as Error).message });
    }
  }

  return NextResponse.json({ succeeded, errors });
}
