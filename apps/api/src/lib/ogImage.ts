const USER_AGENT = "tech-ai-news-bot/0.1 (+https://github.com/FAL-coffee/tech-ai-news)";

const META_TAG_RE = /<meta\b[^>]*>/gi;

function extractAttr(tag: string, attr: string): string | null {
  const re = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i");
  const match = tag.match(re);
  return match ? match[1] : null;
}

function findImageMetaTag(html: string): string | null {
  const metaTags = html.match(META_TAG_RE) ?? [];
  let twitterImage: string | null = null;

  for (const tag of metaTags) {
    const key = extractAttr(tag, "property") ?? extractAttr(tag, "name");
    if (!key) continue;
    const content = extractAttr(tag, "content");
    if (!content) continue;

    if (key.toLowerCase() === "og:image") return content;
    if (key.toLowerCase() === "twitter:image" && !twitterImage) twitterImage = content;
  }

  return twitterImage;
}

/**
 * 記事一覧・詳細でのビジュアル表現のため、原文ページのOGP画像(og:image、無ければtwitter:image)を取得する。
 * 取得できなくても記事生成自体は継続できる機能なので、失敗時は例外を投げずnullを返す。
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;

    const html = await res.text();
    const imageUrl = findImageMetaTag(html);
    if (!imageUrl) return null;

    return new URL(imageUrl, res.url).toString();
  } catch {
    return null;
  }
}
