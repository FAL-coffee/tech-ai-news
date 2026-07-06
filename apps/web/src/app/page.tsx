import Link from "next/link";
import { listPublishedArticles } from "@tech-ai-news/db";
import type { Lang } from "@tech-ai-news/shared";
import { ArticleCard } from "../components/ArticleCard";
import { LangToggle } from "../components/LangToggle";
import { getDb } from "../lib/db";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ lang?: string; topic?: string }>;
}

export default async function HomePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const lang: Lang = params.lang === "en" ? "en" : "ja";
  const topic = params.topic;

  const db = getDb();
  const articles = await listPublishedArticles(db, { topic, limit: 50 });

  return (
    <main>
      <div className="header">
        <h1>{lang === "ja" ? "Tech / AI ニュース" : "Tech / AI News"}</h1>
        <LangToggle lang={lang} />
      </div>

      {topic && (
        <p className="topic-filter">
          {lang === "ja" ? `トピック: ${topic}` : `Topic: ${topic}`} —{" "}
          <Link href={`/?lang=${lang}`}>{lang === "ja" ? "解除" : "clear"}</Link>
        </p>
      )}

      <div className="article-list">
        {articles.length === 0 && (
          <p>
            {lang === "ja"
              ? "まだ記事がありません。pnpm pipeline を実行してください。"
              : "No articles yet. Run pnpm pipeline first."}
          </p>
        )}
        {articles.map((article) => (
          <ArticleCard key={article.id} article={article} lang={lang} />
        ))}
      </div>
    </main>
  );
}
