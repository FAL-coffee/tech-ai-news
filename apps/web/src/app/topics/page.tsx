import type { Metadata } from "next";
import Link from "next/link";
import { listTopicsWithArticleCount } from "@tech-ai-news/db";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "トピック一覧",
  description: "テック/AIニュースのトピック一覧。気になるトピックから関連記事を探せます。",
};

export default async function TopicsPage() {
  const db = getDb();
  const topics = await listTopicsWithArticleCount(db);

  return (
    <main className="page">
      <div className="hero">
        <span className="hero-eyebrow">Topics</span>
        <h1 className="hero-title">トピック一覧</h1>
        <p className="hero-subtitle">気になるトピックを選ぶと、関連する記事を絞り込んで読めます。</p>
      </div>

      <div className="topics-grid">
        {topics.map((topic) => (
          <Link key={topic.id} href={`/?topic=${topic.slug}`} className="topic-count-card">
            <div className="topic-count-value">{topic.articleCount}</div>
            <div className="topic-count-label">{topic.nameJa}</div>
          </Link>
        ))}
      </div>
    </main>
  );
}
