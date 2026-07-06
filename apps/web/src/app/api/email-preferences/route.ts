import { upsertEmailPreference } from "@tech-ai-news/db";
import { randomBytes } from "node:crypto";
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
  const digestEnabled = body.digestEnabled === true;

  const db = getDb();
  await upsertEmailPreference(db, {
    userId: session.user.id,
    digestEnabled,
    // 既存の設定がある場合、このトークンはDB側のON CONFLICTで無視され既存トークンが維持される。
    unsubscribeToken: randomBytes(24).toString("hex"),
  });

  return NextResponse.json({ ok: true });
}
