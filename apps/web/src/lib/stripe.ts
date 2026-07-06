import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * モジュール読み込み時ではなく初回利用時に生成する(getDb()と同じ遅延失敗の方針)。
 * これにより STRIPE_SECRET_KEY 未設定でも `next build` やページ表示自体は壊れない。
 */
export function getStripe(): Stripe {
  if (!cached) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      throw new Error("Missing required environment variable: STRIPE_SECRET_KEY");
    }
    cached = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });
  }
  return cached;
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
