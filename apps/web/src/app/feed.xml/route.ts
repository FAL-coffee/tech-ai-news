import { listPublishedArticles } from "@tech-ai-news/db";
import { getDb } from "../../lib/db";
import { appUrl } from "../../lib/site";

export const dynamic = "force-dynamic";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** サイト全体の公開記事RSS。社内ツールへの取り込み・購読リーダー登録向け(認証不要)。 */
export async function GET() {
  const db = getDb();
  const siteUrl = appUrl();
  const articles = await listPublishedArticles(db, { limit: 50 });

  const items = articles
    .map((article) => {
      const url = `${siteUrl}/articles/${article.slug}`;
      return `
        <item>
          <title>${escapeXml(article.title)}</title>
          <link>${url}</link>
          <guid isPermaLink="true">${url}</guid>
          <pubDate>${new Date(article.originalPublishedAt ?? article.publishedAt).toUTCString()}</pubDate>
          <description>${escapeXml(article.summary)}</description>
          <source url="${escapeXml(article.originalUrl)}">${escapeXml(article.sourceName)}</source>
        </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>tech/ai news</title>
    <link>${siteUrl}</link>
    <description>まとめでも翻訳でもない。公式発表を、AIが日本語でわかりやすく。</description>
    <language>ja</language>
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "content-type": "application/rss+xml; charset=utf-8" },
  });
}
