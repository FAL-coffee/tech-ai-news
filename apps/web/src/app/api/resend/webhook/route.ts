import { addSuppression, recordEmailEvent } from "@tech-ai-news/db";
import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { getDb } from "../../../../lib/db";

/**
 * Resendの配信イベントwebhook(svix形式)。
 * - 全イベントをemail_eventsに記録(開封/クリック計測・配信トラブル調査用)
 * - バウンス・苦情(スパム報告)は特電法・到達率維持のためsuppressions(恒久除外リスト)へ追加。
 *   以後のダイジェスト配信対象から自動的に外れる(listDigestRecipientsが除外する)。
 *
 * 設定: Resendダッシュボード → Webhooks → `{APP_URL}/api/resend/webhook` を登録し、
 * Signing Secret(whsec_...)を RESEND_WEBHOOK_SECRET に設定する。
 */

const TIMESTAMP_TOLERANCE_SEC = 5 * 60;

/** svix署名検証: base64(HMAC-SHA256(secret, "{id}.{timestamp}.{payload}")) を突き合わせる。 */
function verifySvixSignature(secret: string, id: string, timestamp: string, signatureHeader: string, payload: string): boolean {
  const secretBytes = Buffer.from(secret.replace(/^whsec_/, ""), "base64");
  const expected = createHmac("sha256", secretBytes).update(`${id}.${timestamp}.${payload}`).digest();

  // ヘッダはスペース区切りで複数署名が入りうる("v1,<base64> v1,<base64>")。
  return signatureHeader.split(" ").some((part) => {
    const [version, signature] = part.split(",");
    if (version !== "v1" || !signature) return false;
    const actual = Buffer.from(signature, "base64");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}

interface ResendWebhookEvent {
  type: string;
  data?: {
    email_id?: string;
    to?: string[] | string;
    bounce?: { type?: string };
  };
}

export async function POST(request: Request) {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[resend webhook] RESEND_WEBHOOK_SECRET is not set");
    return NextResponse.json({ error: "webhook not configured" }, { status: 500 });
  }

  const payload = await request.text();
  const svixId = request.headers.get("svix-id");
  const svixTimestamp = request.headers.get("svix-timestamp");
  const svixSignature = request.headers.get("svix-signature");

  if (!svixId || !svixTimestamp || !svixSignature) {
    return NextResponse.json({ error: "missing signature headers" }, { status: 400 });
  }

  // リプレイ攻撃対策: 古すぎる(または未来すぎる)タイムスタンプは拒否する。
  const skewSec = Math.abs(Date.now() / 1000 - Number(svixTimestamp));
  if (!Number.isFinite(skewSec) || skewSec > TIMESTAMP_TOLERANCE_SEC) {
    return NextResponse.json({ error: "timestamp out of tolerance" }, { status: 400 });
  }

  if (!verifySvixSignature(secret, svixId, svixTimestamp, svixSignature, payload)) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }

  let event: ResendWebhookEvent;
  try {
    event = JSON.parse(payload);
  } catch {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  const recipients = Array.isArray(event.data?.to) ? event.data.to : event.data?.to ? [event.data.to] : [];
  // "email.bounced" → "bounced" のように短縮してイベント種別として記録する。
  const eventType = event.type.replace(/^email\./, "");

  const db = getDb();
  for (const email of recipients) {
    await recordEmailEvent(db, {
      resendEmailId: event.data?.email_id ?? null,
      email,
      eventType,
      payload: event,
    });

    // 苦情(スパム報告)と恒久バウンスのみ恒久除外。一時的なバウンス(メールボックス満杯等)は除外しない。
    const bounceType = event.data?.bounce?.type?.toLowerCase();
    const isTransientBounce = bounceType === "transient" || bounceType === "soft";
    if (event.type === "email.complained" || (event.type === "email.bounced" && !isTransientBounce)) {
      await addSuppression(db, email, eventType);
    }
  }

  return NextResponse.json({ ok: true });
}
