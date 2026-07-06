const USER_AGENT = "tech-ai-news-bot/0.1 (+https://github.com/FAL-coffee/tech-ai-news)";

export interface HnItem {
  title: string;
  link: string;
  isoDate: string | null;
  contentText: string;
}

interface HnHit {
  objectID: string;
  title: string | null;
  url: string | null;
  created_at: string | null;
  points: number | null;
  num_comments: number | null;
}

interface HnSearchResponse {
  hits?: HnHit[];
  nbPages?: number;
}

export function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

const HITS_PER_PAGE = 100;
const MAX_PAGES = 10; // 1ページ100件 x 10 = 最大1,000件まで(初回48時間分の取りこぼし防止・暴走防止の上限)

/**
 * Hacker News (Algolia Search API、無料・認証不要) から、指定時刻以降に投稿されたstoryのうち
 * `trustedDomains` に含まれるドメインへリンクしているものだけを返す。
 *
 * Algolia検索は1リクエストにつき最大100件しか返さないため、`numericFilters`の期間内に
 * 100件を超える投稿がある場合(特に初回の48時間さかのぼり)を取りこぼさないようページングする。
 *
 * 法務ガードレール(docs/spec.md §9)遵守のため、収集対象は事前に許可した一次情報ドメインに
 * 限定する。HN自体は二次情報(third-partyキュレーション)なので、リンク先が信頼済みでない
 * 記事は一切収集しない。
 */
export async function fetchHackerNewsForTrustedDomains(
  sinceUnixSeconds: number,
  trustedDomains: ReadonlySet<string>,
): Promise<HnItem[]> {
  const items: HnItem[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      tags: "story",
      numericFilters: `created_at_i>${sinceUnixSeconds}`,
      hitsPerPage: String(HITS_PER_PAGE),
      page: String(page),
    });
    const res = await fetch(`https://hn.algolia.com/api/v1/search_by_date?${params}`, {
      headers: { "user-agent": USER_AGENT },
    });
    if (!res.ok) {
      throw new Error(`hacker news fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as HnSearchResponse;
    const hits = Array.isArray(data.hits) ? data.hits : [];

    for (const hit of hits) {
      if (!hit.url || !hit.title) continue;
      const hostname = hostnameOf(hit.url);
      if (!hostname || !trustedDomains.has(hostname)) continue;

      items.push({
        title: hit.title,
        link: hit.url,
        isoDate: hit.created_at,
        contentText: `${hit.title}\n\nHacker Newsで${hit.points ?? 0}ポイント・${hit.num_comments ?? 0}件のコメントを集めています。議論: https://news.ycombinator.com/item?id=${hit.objectID}`,
      });
    }

    const isLastPage = hits.length < HITS_PER_PAGE || (typeof data.nbPages === "number" && page + 1 >= data.nbPages);
    if (isLastPage) break;
  }

  return items;
}
