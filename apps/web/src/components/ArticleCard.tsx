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
        <span>{article.sourceName}</span>
        <span aria-hidden="true">·</span>
        <span>
          {lang === "ja" ? "重要度" : "importance"} {article.importance}
        </span>
        <span aria-hidden="true">·</span>
        <span>{new Date(article.publishedAt).toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US")}</span>
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
