import type { Metadata } from "next";
import Link from "next/link";
import { countPublishedArticles, listPublishedArticles, listTopicsWithArticleCount } from "@tech-ai-news/db";
import { ArticleCard } from "../../components/ArticleCard";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "記事アーカイブ",
  description: "公開したテック/AIニュース記事を、トピック別に新着順で読めます。期間・キーワードでも絞り込めます。",
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
  const [articles, total, topics, allCount] = await Promise.all([
    listPublishedArticles(db, { topic, search, dateFrom, dateTo, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    countPublishedArticles(db, { topic, search, dateFrom, dateTo }),
    listTopicsWithArticleCount(db),
    countPublishedArticles(db, {}),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const baseParams: Record<string, string> = {};
  if (topic) baseParams.topic = topic;
  if (search) baseParams.q = search;
  if (from) baseParams.from = from;
  if (to) baseParams.to = to;

  // トピックチップは現在のキーワード・期間指定を保ったまま、トピックだけを切り替える。
  function chipHref(nextTopic?: string): string {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (nextTopic) params.set("topic", nextTopic);
    const qs = params.toString();
    return qs ? `/archive?${qs}` : "/archive";
  }

  return (
    <main className="page">
      <div className="hero">
        <span className="hero-eyebrow">Archive</span>
        <h1 className="hero-title">記事アーカイブ</h1>
        <p className="hero-subtitle">トピック別に新着順で読めます。「あのアップデート何だっけ」はキーワード・期間からも探せます。</p>
      </div>

      <div className="topic-chip-row">
        <Link href={chipHref(undefined)} className={`topic-chip${!topic ? " topic-chip-active" : ""}`}>
          すべて<span className="topic-chip-count">{allCount}</span>
        </Link>
        {topics
          .filter((t) => t.articleCount > 0)
          .map((t) => (
            <Link
              key={t.slug}
              href={chipHref(t.slug)}
              className={`topic-chip${topic === t.slug ? " topic-chip-active" : ""}`}
            >
              {t.nameJa}
              <span className="topic-chip-count">{t.articleCount}</span>
            </Link>
          ))}
      </div>

      <form className="archive-filter-form" action="/archive" method="get">
        {topic && <input type="hidden" name="topic" value={topic} />}
        <input type="search" name="q" defaultValue={search} placeholder="キーワードで検索" />
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
