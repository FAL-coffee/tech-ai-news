import type { Metadata } from "next";
import Link from "next/link";
import { countPublishedArticles, listPublishedArticles, listTopics } from "@tech-ai-news/db";
import { ArticleCard } from "../../components/ArticleCard";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "記事アーカイブ",
  description: "過去に公開したテック/AIニュース記事を、期間・トピック・キーワードで絞り込んで検索できます。",
};

const PAGE_SIZE = 20;

interface PageProps {
  searchParams: Promise<{ topic?: string; q?: string; from?: string; to?: string; page?: string }>;
}

export default async function ArchivePage({ searchParams }: PageProps) {
  const { topic, q, from, to, page: pageParam } = await searchParams;
  const search = q?.trim() ?? "";
  const page = Math.max(1, Number(pageParam) || 1);

  // "to" は日付(YYYY-MM-DD)入力を「翌日0時未満」として扱い、その日を含めて検索する。
  const dateFrom = from ? new Date(from).toISOString() : undefined;
  const dateTo = to ? new Date(new Date(to).getTime() + 24 * 3600 * 1000).toISOString() : undefined;

  const db = getDb();
  const [articles, total, topics] = await Promise.all([
    listPublishedArticles(db, { topic, search, dateFrom, dateTo, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    countPublishedArticles(db, { topic, search, dateFrom, dateTo }),
    listTopics(db),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseParams: Record<string, string> = {};
  if (topic) baseParams.topic = topic;
  if (search) baseParams.q = search;
  if (from) baseParams.from = from;
  if (to) baseParams.to = to;

  return (
    <main className="page">
      <div className="hero">
        <span className="hero-eyebrow">Archive</span>
        <h1 className="hero-title">記事アーカイブ</h1>
        <p className="hero-subtitle">「あのアップデート何だっけ」を、期間・トピック・キーワードで後から探せます。</p>
      </div>

      <form className="archive-filter-form" action="/archive" method="get">
        <input type="search" name="q" defaultValue={search} placeholder="キーワードで検索" />
        <select name="topic" defaultValue={topic ?? ""}>
          <option value="">すべてのトピック</option>
          {topics.map((t) => (
            <option key={t.slug} value={t.slug}>
              {t.nameJa}
            </option>
          ))}
        </select>
        <label className="archive-date-label">
          From
          <input type="date" name="from" defaultValue={from ?? ""} />
        </label>
        <label className="archive-date-label">
          To
          <input type="date" name="to" defaultValue={to ?? ""} />
        </label>
        <button type="submit" className="btn btn-secondary">
          絞り込む
        </button>
      </form>

      <div className="article-list">
        {articles.length === 0 && <div className="empty-state">該当する記事が見つかりませんでした。</div>}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && (
            <Link
              href={`/archive?${new URLSearchParams({ ...baseParams, page: String(page - 1) })}`}
              className="btn btn-secondary btn-small"
            >
              前へ
            </Link>
          )}
          <span className="meta">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/archive?${new URLSearchParams({ ...baseParams, page: String(page + 1) })}`}
              className="btn btn-secondary btn-small"
            >
              次へ
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
