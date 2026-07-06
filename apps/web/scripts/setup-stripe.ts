import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import Stripe from "stripe";

const here = dirname(fileURLToPath(import.meta.url));
const candidates = [resolve(here, "../../../.env"), resolve(process.cwd(), ".env")];
for (const path of candidates) {
  if (existsSync(path)) {
    config({ path });
    break;
  }
}

async function main() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY が設定されていません。.env に追加してから実行してください。");
  }

  const stripe = new Stripe(key, { apiVersion: "2026-06-24.dahlia" });

  const product = await stripe.products.create({
    name: "tech-ai-news スタンダードプラン",
    description: "テック/AI一次情報の日英AI記事を全文閲覧できる月額プラン",
  });

  const price = await stripe.prices.create({
    product: product.id,
    currency: "jpy",
    unit_amount: 980,
    recurring: { interval: "month" },
  });

  console.log("Stripe商品・価格を作成しました。");
  console.log(`  Product ID: ${product.id}`);
  console.log(`  Price ID:   ${price.id}`);
  console.log("");
  console.log(".env の STRIPE_PRICE_ID に以下を設定してください:");
  console.log(`  STRIPE_PRICE_ID=${price.id}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
