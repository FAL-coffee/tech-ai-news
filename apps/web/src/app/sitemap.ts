import { listPublishedArticles } from "@tech-ai-news/db";
import type { MetadataRoute } from "next";
import { getDb } from "../lib/db";
import { appUrl } from "../lib/site";

// DB接続がビルド時に必ずしも利用可能とは限らないため、リクエスト時に生成する。
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const db = getDb();
  const articles = await listPublishedArticles(db, { limit: 1000 });
  const base = appUrl();

  return [
    { url: base, changeFrequency: "hourly", priority: 1 },
    { url: `${base}/pricing`, changeFrequency: "monthly", priority: 0.5 },
    ...articles.map((article) => ({
      url: `${base}/articles/${article.slug}`,
      lastModified: article.publishedAt,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
