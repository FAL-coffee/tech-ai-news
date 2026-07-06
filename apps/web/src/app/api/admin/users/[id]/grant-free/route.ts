import { upsertSubscription } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "../../../../../../lib/admin";
import { auth } from "../../../../../../lib/auth";
import { getDb } from "../../../../../../lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();

  await upsertSubscription(db, {
    userId: id,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    status: "active",
    plan: "comp",
    currentPeriodEnd: null,
  });

  return NextResponse.json({ ok: true });
}
