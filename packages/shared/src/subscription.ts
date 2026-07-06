import type { SubscriptionStatus } from "./types";

/** trialing/active のみを「読める」状態とみなす。 */
export function isActiveSubscription(status: SubscriptionStatus | null | undefined): boolean {
  return status === "active" || status === "trialing";
}
