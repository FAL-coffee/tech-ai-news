import { upsertSubscription } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getDb } from "../../../../lib/db";
import { getStripe } from "../../../../lib/stripe";

// Route Handler は既定でNode runtimeだが、stripe.webhooks.constructEventはNodeの同期cryptoに
// 依存するため明示しておく(誤ってedge runtimeへ変更されるのを防ぐ)。
export const runtime = "nodejs";

function toIso(unixSeconds: number | null | undefined): string | null {
  return typeof unixSeconds === "number" ? new Date(unixSeconds * 1000).toISOString() : null;
}

export async function POST(request: Request) {
  const stripe = getStripe();
  const signature = (await headers()).get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ message: "missing signature or webhook secret" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ message: `Webhook Error: ${message}` }, { status: 400 });
  }

  const db = getDb();

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        if (userId && session.subscription && session.customer) {
          const subscriptionId =
            typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const customerId = typeof session.customer === "string" ? session.customer : session.customer.id;
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await upsertSubscription(db, {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodEnd: toIso(subscription.items.data[0]?.current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.userId;
        const customerId =
          typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
        if (userId) {
          await upsertSubscription(db, {
            userId,
            stripeCustomerId: customerId,
            stripeSubscriptionId: subscription.id,
            status: subscription.status,
            currentPeriodEnd: toIso(subscription.items.data[0]?.current_period_end),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("stripe webhook handler failed", err);
    return NextResponse.json({ message: "webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
