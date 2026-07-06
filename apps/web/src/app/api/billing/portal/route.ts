import { getSubscriptionByUserId } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";
import { appUrl } from "../../../../lib/site";
import { getStripe } from "../../../../lib/stripe";

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(new URL("/login?next=/account", appUrl()));
  }

  const db = getDb();
  const subscription = await getSubscriptionByUserId(db, session.user.id);
  if (!subscription?.stripeCustomerId) {
    return NextResponse.redirect(new URL("/account", appUrl()));
  }

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${appUrl()}/account`,
  });

  return NextResponse.redirect(portalSession.url, { status: 303 });
}
