import { recordReferral } from "@tech-ai-news/db";
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
  const referrerUserId = typeof body.referrerUserId === "string" ? body.referrerUserId : null;

  // 自己紹介や無効な値は静かに無視する(サインアップ自体は既に成功しているため)。
  if (!referrerUserId || referrerUserId === session.user.id) {
    return NextResponse.json({ ok: false });
  }

  const db = getDb();
  try {
    await recordReferral(db, session.user.id, referrerUserId);
  } catch {
    // referrerUserIdが存在しないユーザーIDの場合、FK制約違反で失敗する。無視してよい(改ざん・無効リンク対策)。
    return NextResponse.json({ ok: false });
  }

  return NextResponse.json({ ok: true });
}
