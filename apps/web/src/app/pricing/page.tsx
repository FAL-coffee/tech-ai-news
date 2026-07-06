import { getSubscriptionByUserId } from "@tech-ai-news/db";
import { isActiveSubscription } from "@tech-ai-news/shared";
import { headers } from "next/headers";
import Link from "next/link";
import { auth } from "../../lib/auth";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export default async function PricingPage() {
  const session = await auth.api.getSession({ headers: await headers() });

  let alreadyActive = false;
  if (session) {
    const db = getDb();
    const subscription = await getSubscriptionByUserId(db, session.user.id);
    alreadyActive = isActiveSubscription(subscription?.status);
  }

  return (
    <main>
      <h1>料金プラン</h1>
      <div className="pricing-card">
        <h2>スタンダードプラン</h2>
        <p className="price">月額 980円(税込)</p>
        <ul>
          <li>すべての記事を全文閲覧</li>
          <li>興味のあるトピックの選択</li>
          <li>日本語・英語どちらでも閲覧可能</li>
        </ul>

        {alreadyActive ? (
          <p>
            すでにご登録いただいています。<Link href="/account">アカウント</Link>から管理できます。
          </p>
        ) : session ? (
          <form action="/api/billing/checkout" method="post">
            <button type="submit">登録する</button>
          </form>
        ) : (
          <Link href="/signup?next=/pricing">新規登録して申し込む</Link>
        )}
      </div>
    </main>
  );
}
