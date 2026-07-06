import { getSubscriptionByUserId, upsertSubscription } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "../../../../../../lib/admin";
import { auth } from "../../../../../../lib/auth";
import { getDb } from "../../../../../../lib/db";
import { getStripe } from "../../../../../../lib/stripe";

function toIso(unixSeconds: number | null | undefined): string | null {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000).toISOString() : null;
}

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  const subscription = await getSubscriptionByUserId(db, id);
  if (!subscription) {
    return NextResponse.json({ error: "subscription not found" }, { status: 404 });
  }

  if (subscription.stripeSubscriptionId) {
    const stripe = getStripe();
    const canceled = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
    await upsertSubscription(db, {
      userId: id,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: canceled.id,
      status: canceled.status,
      plan: subscription.plan,
      currentPeriodEnd: toIso(canceled.items.data[0]?.current_period_end),
    });
  } else {
    await upsertSubscription(db, {
      userId: id,
      stripeCustomerId: subscription.stripeCustomerId,
      stripeSubscriptionId: null,
      status: "canceled",
      plan: subscription.plan,
      currentPeriodEnd: null,
    });
  }

  return NextResponse.json({ ok: true });
}
