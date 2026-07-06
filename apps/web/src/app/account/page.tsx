import { getSubscriptionByUserId, getUserTopicSlugs, listTopics } from "@tech-ai-news/db";
import { isActiveSubscription } from "@tech-ai-news/shared";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { SignOutButton } from "../../components/SignOutButton";
import { TopicSelector } from "../../components/TopicSelector";
import { auth } from "../../lib/auth";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?next=/account");
  }

  const db = getDb();
  const [subscription, topics, selectedSlugs] = await Promise.all([
    getSubscriptionByUserId(db, session.user.id),
    listTopics(db),
    getUserTopicSlugs(db, session.user.id),
  ]);

  const active = isActiveSubscription(subscription?.status);

  return (
    <main className="page">
      <div className="account-header">
        <h1 className="hero-title">アカウント</h1>
        <SignOutButton />
      </div>
      <p className="account-email">{session.user.email}</p>

      <section className="card">
        <h2>プラン</h2>
        {active ? (
          <>
            <span className="status-badge status-badge-active">有料会員 · {subscription?.status}</span>
            {subscription?.currentPeriodEnd && (
              <p className="meta">
                次回更新日: {new Date(subscription.currentPeriodEnd).toLocaleDateString("ja-JP")}
              </p>
            )}
            <div className="card-actions">
              <form action="/api/billing/portal" method="post">
                <button type="submit" className="btn btn-secondary">
                  お支払い方法・請求情報を管理
                </button>
              </form>
            </div>
          </>
        ) : (
          <>
            <span className="status-badge status-badge-inactive">無料プラン</span>
            <p className="meta">全文記事を読むには有料プランへの登録が必要です。</p>
            <div className="card-actions">
              <Link href="/pricing" className="btn btn-primary">
                プランを見る
              </Link>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>興味のあるトピック</h2>
        <p className="meta">選択したトピックは今後のメールダイジェスト機能で使用されます。</p>
        <TopicSelector topics={topics} initialSelected={selectedSlugs} />
      </section>
    </main>
  );
}
