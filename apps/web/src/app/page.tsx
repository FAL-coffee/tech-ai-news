import type { Metadata } from "next";
import Link from "next/link";
import { countPublishedArticles, listPublishedArticles } from "@tech-ai-news/db";
import { ArticleCard } from "../components/ArticleCard";
import { getDb } from "../lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

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

  const db = getDb();
  const [articles, total] = await Promise.all([
    listPublishedArticles(db, { topic, search, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    countPublishedArticles(db, { topic, search }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const baseParams: Record<string, string> = {};
  if (topic) baseParams.topic = topic;
  if (search) baseParams.q = search;

  return (
    <main className="page">
      <div className="hero">
        <span className="hero-eyebrow">Primary Sources Only</span>
        <h1 className="hero-title">Tech / AI ニュース</h1>
        <p className="hero-subtitle">公式ブログ・公式アカウントなどの一次情報を、AIが日本語記事として再構成してお届けします。</p>
      </div>

      <form className="search-bar" action="/" method="get">
        {topic && <input type="hidden" name="topic" value={topic} />}
        <input type="search" name="q" defaultValue={search} placeholder="記事を検索(タイトル・本文から検索)" />
        <button type="submit" className="btn btn-secondary">
          検索
        </button>
      </form>
      <p className="topics-link-row">
        <Link href="/topics">トピック一覧から探す →</Link>
      </p>

      {topic && (
        <p className="topic-filter">
          トピック: {topic}
          <Link href={search ? `/?q=${encodeURIComponent(search)}` : "/"}>解除</Link>
        </p>
      )}

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
