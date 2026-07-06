import Link from "next/link";
import { listPublishedArticles } from "@tech-ai-news/db";
import { ArticleCard } from "../components/ArticleCard";
import { getDb } from "../lib/db";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ topic?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const { topic } = await searchParams;

  const db = getDb();
  const articles = await listPublishedArticles(db, { topic, limit: 50 });

  return (
    <main className="page">
      <div className="hero">
        <span className="hero-eyebrow">Primary Sources Only</span>
        <h1 className="hero-title">Tech / AI ニュース</h1>
        <p className="hero-subtitle">公式ブログ・公式アカウントなどの一次情報を、AIが日本語記事として再構成してお届けします。</p>
      </div>

      {topic && (
        <p className="topic-filter">
          トピック: {topic}
          <Link href="/">解除</Link>
        </p>
      )}

      <div className="article-list">
        {articles.length === 0 && (
          <div className="empty-state">近日公開予定です。公式ソースから記事を準備中です。</div>
        )}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>
    </main>
  );
}
