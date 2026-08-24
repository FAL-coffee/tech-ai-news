import type { Metadata } from "next";
import Link from "next/link";
import {
  countPublishedArticles,
  getSubscriptionByUserId,
  getUserTopicSlugs,
  listPublishedArticles,
  listRecommendedArticles,
} from "@tech-ai-news/db";
import { isActiveSubscription } from "@tech-ai-news/shared";
import { headers } from "next/headers";
import { ArticleCard } from "../components/ArticleCard";
import { auth } from "../lib/auth";
import { getDb } from "../lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;
const RECOMMENDED_LIMIT = 6;

interface PageProps {
  searchParams: Promise<{ topic?: string; q?: string; page?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { topic } = await searchParams;
  if (!topic) return {};
  return {
    title: `${topic}の記事一覧`,
    description: `${topic}に関するテック/AIニュースの記事一覧。公式ブログ・公式アカウントなどの一次情報をAIが日本語記事として再構成してお届けします。`,
  };
}

export default async function HomePage({ searchParams }: PageProps) {
  const { topic, q, page: pageParam } = await searchParams;
  const search = q?.trim() ?? "";
  const page = Math.max(1, Number(pageParam) || 1);
  const showRecommended = !topic && !search && page === 1;

  const db = getDb();
  const [articles, total, session] = await Promise.all([
    listPublishedArticles(db, { topic, search, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    countPublishedArticles(db, { topic, search }),
    showRecommended ? auth.api.getSession({ headers: await headers() }) : null,
  ]);

  const userTopicSlugs = showRecommended && session ? await getUserTopicSlugs(db, session.user.id) : [];
  const recommended = showRecommended
    ? await listRecommendedArticles(db, {
        topicSlugs: userTopicSlugs,
        excludeIds: articles.map((a) => a.id),
        limit: RECOMMENDED_LIMIT,
      })
    : [];

  const subscription = showRecommended && session ? await getSubscriptionByUserId(db, session.user.id) : null;
  const showTrialCta = showRecommended && !isActiveSubscription(subscription?.status);
  const trialCtaHref = session ? "/pricing" : "/signup?next=/pricing";

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseParams: Record<string, string> = {};
  if (topic) baseParams.topic = topic;
  if (search) baseParams.q = search;

  return (
    <main className="page">
      <div className="hero">
        <span className="hero-eyebrow">Primary Sources Only</span>
        <h1 className="hero-title">公式ブログとリリースノートを、日本語の記事にして毎朝届けます。</h1>
        <p className="hero-subtitle">
          まとめサイトの記事や機械翻訳ではなく、一次情報だけを追っています。興味のあるトピックだけ選んで読めます。
        </p>

        {showTrialCta && (
          <div className="hero-cta-row">
            <Link href={trialCtaHref} className="btn btn-accent">
              14日間無料で試す
            </Link>
            <span className="hero-cta-note">月980円・カード登録の上14日間無料、いつでも解約可能</span>
          </div>
        )}

        <ul className="hero-points">
          <li className="hero-point">
            <span className="hero-point-label">一次情報のみ</span>
            <span className="hero-point-desc">公式ブログ・リリースノートだけを収集、二次情報は扱いません</span>
          </li>
          <li className="hero-point">
            <span className="hero-point-label">毎朝ダイジェスト</span>
            <span className="hero-point-desc">興味トピックの新着記事をメールでまとめて</span>
          </li>
          <li className="hero-point">
            <span className="hero-point-label">原文リンク明記</span>
            <span className="hero-point-desc">出典と原文へのリンクを必ず併記</span>
          </li>
        </ul>
      </div>

      <form className="search-bar" action="/" method="get">
        {topic && <input type="hidden" name="topic" value={topic} />}
        <input type="search" name="q" defaultValue={search} placeholder="記事を検索(タイトル・本文から検索)" />
        <button type="submit" className="btn btn-secondary">
          検索
        </button>
      </form>
      <p className="topics-link-row">
        <Link href="/archive">トピック別・新着順で探す →</Link>
      </p>

      {showRecommended && recommended.length > 0 && (
        <section className="recommended-section">
          <h2 className="section-heading">{userTopicSlugs.length > 0 ? "あなたへのおすすめ" : "注目の記事"}</h2>
          {session && userTopicSlugs.length === 0 && (
            <p className="meta">
              <Link href="/account">興味のあるトピックを選択</Link>すると、おすすめが最適化されます。
            </p>
          )}
          <div className="recommended-grid">
            {recommended.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {topic && (
        <p className="topic-filter">
          トピック: {topic}
          <Link href={search ? `/?q=${encodeURIComponent(search)}` : "/"}>解除</Link>
        </p>
      )}

      {showRecommended && <h2 className="section-heading">新着記事</h2>}

      <div className="article-list">
        {articles.length === 0 && (
          <div className="empty-state">
            {search ? "該当する記事が見つかりませんでした。" : "近日公開予定です。公式ソースから記事を準備中です。"}
          </div>
        )}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && (
            <Link href={`/?${new URLSearchParams({ ...baseParams, page: String(page - 1) })}`} className="btn btn-secondary btn-small">
              前へ
            </Link>
          )}
          <span className="meta">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link href={`/?${new URLSearchParams({ ...baseParams, page: String(page + 1) })}`} className="btn btn-secondary btn-small">
              次へ
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
