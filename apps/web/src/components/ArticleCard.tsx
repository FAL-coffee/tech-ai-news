import Link from "next/link";
import type { Article } from "@tech-ai-news/shared";

export function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="article-card">
      <h2>
        <Link href={`/articles/${article.slug}`}>{article.title}</Link>
      </h2>
      <p className="meta">
        <span>{article.sourceName}</span>
        <span aria-hidden="true">·</span>
        <span>重要度 {article.importance}</span>
        <span aria-hidden="true">·</span>
        <span>{new Date(article.publishedAt).toLocaleDateString("ja-JP")}</span>
      </p>
      <p>{article.summary}</p>
      {article.topics && article.topics.length > 0 && (
        <div className="topics">
          {article.topics.map((topic) => (
            <Link key={topic} href={`/?topic=${topic}`} className="topic-badge">
              {topic}
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}
