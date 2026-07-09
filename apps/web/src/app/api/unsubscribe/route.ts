import { setDigestEnabledByToken } from "@tech-ai-news/db";
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/db";

/**
 * RFC 8058(List-Unsubscribe-Post)対応のワンクリック配信停止エンドポイント。
 * Gmail/Yahoo!の送信者ガイドラインで一括送信者に必須。メールクライアントの
 * 「配信停止」ボタンが List-Unsubscribe ヘッダのURLへ認証なしのPOSTを送ってくる。
 */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "missing token" }, { status: 400 });
  }

  const db = getDb();
  const ok = await setDigestEnabledByToken(db, token, false);
  if (!ok) {
    return NextResponse.json({ error: "invalid token" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
