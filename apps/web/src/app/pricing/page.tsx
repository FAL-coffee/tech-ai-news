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
    <main className="page">
      <div className="pricing-hero">
        <span className="hero-eyebrow">Pricing</span>
        <h1 className="hero-title">料金プラン</h1>
        <p className="hero-subtitle">シンプルな1プランで、すべての一次情報記事を読めます。まずは14日間、無料でお試しいただけます。</p>
      </div>

      <div className="pricing-layout">
        <div className="pricing-card">
          <span className="trial-badge">初回14日間無料</span>
          <h2>スタンダードプラン</h2>
          <p className="price">
            <span className="price-amount">¥980</span>
            <span className="price-period">/ 月(税込)</span>
          </p>
          <ul className="feature-list">
            {["14日間の無料トライアル", "すべての記事を全文閲覧", "興味のあるトピックの選択", "いつでも解約可能"].map((feature) => (
              <li key={feature}>
                <span className="feature-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 12l5 5L20 6" />
                  </svg>
                </span>
                {feature}
              </li>
            ))}
          </ul>

          {alreadyActive ? (
            <p className="pricing-note">
              すでにご登録いただいています。<Link href="/account">アカウント</Link>から管理できます。
            </p>
          ) : session ? (
            <form action="/api/billing/checkout" method="post">
              <button type="submit" className="btn btn-accent btn-block">
                14日間無料で試す
              </button>
            </form>
          ) : (
            <Link href="/signup?next=/pricing" className="btn btn-accent btn-block">
              新規登録して無料で試す
            </Link>
          )}
          <p className="pricing-note">
            お支払い方法の登録が必要です。トライアル期間中はいつでも解約でき、料金は発生しません。期間終了後、解約されていない場合は自動的に有料プランに移行します。
          </p>
        </div>
      </div>
    </main>
  );
}
