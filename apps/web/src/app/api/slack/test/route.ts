import { getEmailPreferenceByUserId } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { sendSlackText } from "../../../../lib/slack";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const preference = await getEmailPreferenceByUserId(db, session.user.id);
  if (!preference?.slackWebhookUrl) {
    return NextResponse.json({ error: "Slack Webhook URLが設定されていません" }, { status: 400 });
  }

  try {
    await sendSlackText(
      preference.slackWebhookUrl,
      ":white_check_mark: tech/ai news — Slack連携のテスト送信です。これが届いていれば設定は正しく動作しています。",
    );
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
