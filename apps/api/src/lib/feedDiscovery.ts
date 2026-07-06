const USER_AGENT = "tech-ai-news-bot/0.1 (+https://github.com/FAL-coffee/tech-ai-news)";

export interface DiscoveredFeed {
  url: string;
  kind: "rss" | "atom";
}

const LINK_TAG_RE = /<link\b[^>]*>/gi;

function extractAttr(tag: string, attr: string): string | null {
  const re = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i");
  const match = tag.match(re);
  return match ? match[1] : null;
}

function findFeedLinkInHtml(html: string, baseUrl: string): DiscoveredFeed | null {
  const linkTags = html.match(LINK_TAG_RE) ?? [];
  for (const tag of linkTags) {
    const rel = extractAttr(tag, "rel");
    if (!rel || !/alternate/i.test(rel)) continue;

    const type = extractAttr(tag, "type") ?? "";
    let kind: "rss" | "atom" | null = null;
    if (/application\/rss\+xml/i.test(type)) kind = "rss";
    else if (/application\/atom\+xml/i.test(type)) kind = "atom";
    if (!kind) continue;

    const href = extractAttr(tag, "href");
    if (!href) continue;

    try {
      return { url: new URL(href, baseUrl).toString(), kind };
    } catch {
      continue;
    }
  }
  return null;
}

/** レスポンスの本文が本当にRSS/Atomフィードかを検証する(200を返す"ソフト404"を弾く)。 */
function classifyFeedBody(contentType: string, body: string): "rss" | "atom" | null {
  if (/application\/rss\+xml/i.test(contentType)) return "rss";
  if (/application\/atom\+xml/i.test(contentType)) return "atom";
  const head = body.slice(0, 2000);
  if (/<rss[\s>]/i.test(head)) return "rss";
  if (/<feed[\s>]/i.test(head) && /xmlns=["']http:\/\/www\.w3\.org\/2005\/Atom["']/i.test(head)) return "atom";
  return null;
}

const CANDIDATE_PATHS = [
  "/rss.xml",
  "/feed.xml",
  "/feed",
  "/rss",
  "/atom.xml",
  "/blog/rss.xml",
  "/blog/feed.xml",
  "/blog/feed",
  "/index.xml",
];

/**
 * ドメインのフィードを自動検出する。
 * 1) トップページの <link rel="alternate" type="application/rss+xml|atom+xml"> を確認
 * 2) 見つからなければ /rss.xml 等の慣習的なパスを順に probe し、本文がXMLフィードであることを検証
 * 見つからなければnullを返す(候補生成自体は止めない)。
 */
export async function discoverFeed(domain: string): Promise<DiscoveredFeed | null> {
  const baseUrl = `https://${domain}/`;

  try {
    const res = await fetch(baseUrl, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(8000) });
    if (res.ok) {
      const html = await res.text();
      const found = findFeedLinkInHtml(html, baseUrl);
      if (found) return found;
    }
  } catch {
    // トップページ取得に失敗しても、以下のパスprobeにフォールバックする。
  }

  for (const path of CANDIDATE_PATHS) {
    const probeUrl = `https://${domain}${path}`;
    try {
      const res = await fetch(probeUrl, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(8000) });
      if (!res.ok) continue;
      const contentType = res.headers.get("content-type") ?? "";
      const body = await res.text();
      const kind = classifyFeedBody(contentType, body);
      // res.url はリダイレクト追跡後の最終URL。既存sourcesと同一フィードにリダイレクトされる
      // ケース(例: vercel.com/blog/rss.xml → vercel.com/atom)で、そのまま既存行と重複させない。
      if (kind) return { url: res.url || probeUrl, kind };
    } catch {
      continue;
    }
  }

  return null;
}
