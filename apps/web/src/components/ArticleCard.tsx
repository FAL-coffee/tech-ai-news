import Link from "next/link";
import type { Article, Lang } from "@tech-ai-news/shared";

export function ArticleCard({ article, lang }: { article: Article; lang: Lang }) {
  const title = lang === "ja" ? article.titleJa : article.titleEn;
  const summary = lang === "ja" ? article.summaryJa : article.summaryEn;

  return (
    <article className="article-card">
      <h2>
        <Link href={`/articles/${article.slug}?lang=${lang}`}>{title}</Link>
      </h2>
      <p className="meta">
        {article.sourceName} · {lang === "ja" ? "重要度" : "importance"} {article.importance} ·{" "}
        {new Date(article.publishedAt).toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US")}
      </p>
      <p>{summary}</p>
      {article.topics && article.topics.length > 0 && (
        <div className="topics">
          {article.topics.map((topic) => (
            <Link key={topic} href={`/?lang=${lang}&topic=${topic}`} className="topic-badge">
              {topic}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
