import Parser from "rss-parser";

// パース部をここに隔離しておくことで、将来 Cloudflare Workers 移行時に
// xml2js(rss-parser の内部依存)が問題になった場合でも差し替えやすくする。
const parser = new Parser();

export interface FeedItem {
  title: string;
  link: string;
  isoDate: string | null;
  contentText: string;
}

export interface FetchFeedResult {
  notModified: boolean;
  etag: string | null;
  lastModified: string | null;
  items: FeedItem[];
}

function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * ETag / Last-Modified による条件付きGETでフィードを取得する。
 * fetch + parser.parseString のみを使用し、parser.parseURL(Node httpに暗黙依存)は使わない。
 */
export async function fetchFeed(
  url: string,
  opts: { etag?: string | null; lastModified?: string | null },
): Promise<FetchFeedResult> {
  const headers: Record<string, string> = {
    "user-agent": "tech-ai-news-bot/0.1 (+https://github.com/FAL-coffee/tech-ai-news)",
  };
  if (opts.etag) headers["if-none-match"] = opts.etag;
  if (opts.lastModified) headers["if-modified-since"] = opts.lastModified;

  const res = await fetch(url, { headers });

  if (res.status === 304) {
    return {
      notModified: true,
      etag: opts.etag ?? null,
      lastModified: opts.lastModified ?? null,
      items: [],
    };
  }
  if (!res.ok) {
    throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const feed = await parser.parseString(xml);

  const items: FeedItem[] = (feed.items ?? []).map((item) => ({
    title: item.title ?? "(no title)",
    link: item.link ?? "",
    isoDate: item.isoDate ?? null,
    contentText: stripHtml(item.contentSnippet ?? item.content ?? item.summary ?? ""),
  }));

  return {
    notModified: false,
    etag: res.headers.get("etag"),
    lastModified: res.headers.get("last-modified"),
    items,
  };
}
