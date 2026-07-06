import { getSubscriptionByUserId } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { appUrl, getStripe, requireEnv } from "../../../../lib/stripe";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(new URL("/login?next=/pricing", appUrl()));
  }

  const db = getDb();
  const existing = await getSubscriptionByUserId(db, session.user.id);
  const stripe = getStripe();

  const trialPeriodDays = Number(process.env.TRIAL_PERIOD_DAYS ?? 14);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: requireEnv("STRIPE_PRICE_ID"), quantity: 1 }],
    customer: existing?.stripeCustomerId,
    customer_email: existing?.stripeCustomerId ? undefined : session.user.email,
    success_url: `${appUrl()}/account?checkout=success`,
    cancel_url: `${appUrl()}/pricing?checkout=canceled`,
    metadata: { userId: session.user.id },
    subscription_data: {
      metadata: { userId: session.user.id },
      trial_period_days: trialPeriodDays > 0 ? trialPeriodDays : undefined,
    },
  });

  if (!checkoutSession.url) {
    return NextResponse.json({ error: "failed to create checkout session" }, { status: 500 });
  }

  return NextResponse.redirect(checkoutSession.url, { status: 303 });
}
