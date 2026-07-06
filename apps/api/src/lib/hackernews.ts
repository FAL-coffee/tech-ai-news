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

export interface HnScanResult {
  /** 信頼済みドメインにリンクしている記事(そのまま raw_items へ収集する対象)。 */
  trustedItems: HnItem[];
  /** 信頼済み/denylist以外で見つかった新規ドメイン → そのドメインで見つけたURLの一例。 */
  candidateDomains: Map<string, string>;
}

/**
 * Hacker News (Algolia Search API、無料・認証不要) をスキャンし、
 * (1) 信頼済み公式ドメインにリンクする記事(そのまま収集対象)と、
 * (2) まだ信頼済みでない新規ドメイン(収集先候補として提案する対象)
 * を1回のページングで同時に集計する。
 *
 * Algolia検索は1リクエストにつき最大100件しか返さないため、`numericFilters`の期間内に
 * 100件を超える投稿がある場合(特に初回の48時間さかのぼり)を取りこぼさないようページングする。
 *
 * 法務ガードレール(docs/spec.md §9)遵守のため、raw_itemsへの収集対象は信頼済みドメインのみ。
 * 信頼済み以外のドメインは「収集先候補」として提案するだけで、コンテンツ自体は一切収集しない。
 */
export async function scanHackerNews(
  sinceUnixSeconds: number,
  trustedDomains: ReadonlySet<string>,
  denylistDomains: ReadonlySet<string>,
): Promise<HnScanResult> {
  const trustedItems: HnItem[] = [];
  const candidateDomains = new Map<string, string>();

  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      tags: "story",
      numericFilters: `created_at_i>${sinceUnixSeconds}`,
      hitsPerPage: String(HITS_PER_PAGE),
      page: String(page),
    });
    const res = await fetch(`https://hn.algolia.com/api/v1/search_by_date?${params}`, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw new Error(`hacker news fetch failed: ${res.status} ${res.statusText}`);
    }

    const data = (await res.json()) as HnSearchResponse;
    const hits = Array.isArray(data.hits) ? data.hits : [];

    for (const hit of hits) {
      if (!hit.url || !hit.title) continue;
      const hostname = hostnameOf(hit.url);
      if (!hostname) continue;

      if (trustedDomains.has(hostname)) {
        trustedItems.push({
          title: hit.title,
          link: hit.url,
          isoDate: hit.created_at,
          contentText: `${hit.title}\n\nHacker Newsで${hit.points ?? 0}ポイント・${hit.num_comments ?? 0}件のコメントを集めています。議論: https://news.ycombinator.com/item?id=${hit.objectID}`,
        });
      } else if (!denylistDomains.has(hostname)) {
        candidateDomains.set(hostname, hit.url);
      }
    }

    const isLastPage = hits.length < HITS_PER_PAGE || (typeof data.nbPages === "number" && page + 1 >= data.nbPages);
    if (isLastPage) break;
  }

  return { trustedItems, candidateDomains };
}
