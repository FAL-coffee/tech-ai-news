import { setUserTopics } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const topics = Array.isArray(body.topics)
    ? body.topics.filter((t: unknown): t is string => typeof t === "string")
    : [];

  const db = getDb();
  await setUserTopics(db, session.user.id, topics);

  return NextResponse.json({ ok: true });
}
