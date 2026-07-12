import { getSubscriptionByUserId, getTopicTrendStats } from "@tech-ai-news/db";
import { isActiveSubscription } from "@tech-ai-news/shared";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "../../lib/auth";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "技術選定ダッシュボード",
  description: "言語・フレームワーク・ライブラリ単位のリリース頻度・破壊的変更頻度を可視化します。",
};

const LOOKBACK_DAYS = 90;

export default async function DashboardPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?next=/dashboard");
  }

  const db = getDb();
  const subscription = await getSubscriptionByUserId(db, session.user.id);
  if (!isActiveSubscription(subscription?.status)) {
    return (
      <main className="page">
        <div className="hero">
          <span className="hero-eyebrow">Dashboard</span>
          <h1 className="hero-title">技術選定ダッシュボード</h1>
        </div>
        <div className="paywall">
          <p>言語・フレームワーク・ライブラリ単位のリリース頻度・破壊的変更頻度の可視化は有料プラン限定機能です。</p>
          <div className="paywall-cta">
            <Link href="/pricing" className="paywall-button">
              プランを見る →
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const sinceDate = new Date(Date.now() - LOOKBACK_DAYS * 24 * 3600 * 1000).toISOString();
  const stats = await getTopicTrendStats(db, sinceDate);
  const maxCount = Math.max(1, ...stats.map((s) => s.articleCount));

  return (
    <main className="page">
      <div className="hero">
        <span className="hero-eyebrow">Dashboard</span>
        <h1 className="hero-title">技術選定ダッシュボード</h1>
        <p className="hero-subtitle">直近{LOOKBACK_DAYS}日間のトピック別リリース頻度・破壊的変更頻度。</p>
      </div>

      {stats.length === 0 ? (
        <div className="empty-state">まだ十分なデータがありません。</div>
      ) : (
        <div className="user-table-wrap">
          <table className="user-table trend-table">
            <thead>
              <tr>
                <th>トピック</th>
                <th>記事数</th>
                <th>破壊的変更 / 非推奨</th>
                <th>平均重要度</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((stat) => (
                <tr key={stat.slug}>
                  <td>
                    <Link href={`/?topic=${stat.slug}`}>{stat.nameJa}</Link>
                  </td>
                  <td>
                    <div className="trend-count-cell">
                      <span
                        className="trend-bar"
                        style={{ width: `${(stat.articleCount / maxCount) * 100}%` }}
                        title={`${stat.articleCount}件`}
                      />
                      <span className="trend-count-value">{stat.articleCount}</span>
                    </div>
                  </td>
                  <td>
                    {stat.breakingChangeCount > 0 && (
                      <span className="trend-flag-badge trend-flag-breaking">破壊的変更 {stat.breakingChangeCount}</span>
                    )}
                    {stat.deprecationCount > 0 && (
                      <span className="trend-flag-badge trend-flag-deprecation">非推奨 {stat.deprecationCount}</span>
                    )}
                    {stat.breakingChangeCount === 0 && stat.deprecationCount === 0 && <span className="meta">なし</span>}
                  </td>
                  <td>{stat.avgImportance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
