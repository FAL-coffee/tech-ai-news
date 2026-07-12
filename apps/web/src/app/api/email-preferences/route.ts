import { updateDigestSettings, upsertEmailPreference } from "@tech-ai-news/db";
import { randomBytes } from "node:crypto";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

const MAX_IMPORTANCE = 100;

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const db = getDb();
  // 既存の設定がある場合、このトークンはDB側のON CONFLICTで無視され既存トークンが維持される。
  const unsubscribeToken = randomBytes(24).toString("hex");

  if (typeof body.digestEnabled === "boolean") {
    await upsertEmailPreference(db, {
      userId: session.user.id,
      digestEnabled: body.digestEnabled,
      unsubscribeToken,
    });
  }

  const hasDigestSettings =
    typeof body.weeklyDigestEnabled === "boolean" ||
    typeof body.minImportance === "number" ||
    typeof body.slackWebhookUrl === "string" ||
    typeof body.slackEnabled === "boolean";

  if (hasDigestSettings) {
    await updateDigestSettings(db, {
      userId: session.user.id,
      unsubscribeToken,
      weeklyDigestEnabled: typeof body.weeklyDigestEnabled === "boolean" ? body.weeklyDigestEnabled : undefined,
      minImportance:
        typeof body.minImportance === "number"
          ? Math.min(MAX_IMPORTANCE, Math.max(0, Math.round(body.minImportance)))
          : undefined,
      slackWebhookUrl: typeof body.slackWebhookUrl === "string" ? body.slackWebhookUrl.trim() || null : undefined,
      slackEnabled: typeof body.slackEnabled === "boolean" ? body.slackEnabled : undefined,
    });
  }

  return NextResponse.json({ ok: true });
}
