import {
  createDb,
  insertRawItem,
  listEnabledSources,
  listKnownCandidateDomains,
  listTrustedDomains,
  updateSourceFetchMeta,
  upsertSourceCandidate,
} from "@tech-ai-news/db";
import type { Db } from "@tech-ai-news/db";
import type { Source } from "@tech-ai-news/shared";
import { env } from "../env";
import { fetchBlueskyAuthorFeed } from "../lib/bluesky";
import { DOMAIN_DENYLIST } from "../lib/domainDenylist";
import { fetchFeed } from "../lib/feed";
import { discoverFeed } from "../lib/feedDiscovery";
import { scanHackerNews } from "../lib/hackernews";
import { sha256 } from "../lib/hash";
import { fetchPageText } from "../lib/pageContent";

export interface CollectSummary {
  sourcesChecked: number;
  fetched: number;
  notModified: number;
  inserted: number;
  skipped: number;
  candidatesDiscovered: number;
  errors: { source: string; message: string }[];
}

// Cloudflare Workersは1回の実行あたりの外部リクエスト数に上限がある(無料プランは50件)。
// discoverFeed()はドメインごとに最大10リクエストかかるため、新規ドメインが多いHNスキャン結果を
// そのまま全件処理すると簡単に上限を超えてしまう。1回の実行で自動検出を試みる新規ドメイン数を
// 制限し、残りは次回以降の実行に回す(候補自体はfeed未検出のまま先にDBへ記録するので取りこぼさない)。
const MAX_FEED_DISCOVERY_PER_RUN = 5;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function insertItems(
  db: Db,
  source: Source,
  items: { link: string; title: string; contentText: string | null; isoDate: string | null }[],
  summary: CollectSummary,
): Promise<void> {
  for (const item of items) {
    if (!item.link) continue;
    const contentHash = sha256(`${item.link}\n${item.title}\n${item.contentText ?? ""}`);
    const inserted = await insertRawItem(db, {
      sourceId: source.id,
      externalUrl: item.link,
      title: item.title,
      contentText: item.contentText,
      contentHash,
      publishedAt: item.isoDate,
    });
    // グローバルに external_url を一意化しているため、他ソース由来の重複記事もここでskip扱いになる。
    if (inserted) summary.inserted += 1;
    else summary.skipped += 1;
  }
}

async function collectFeedSource(db: Db, source: Source, summary: CollectSummary): Promise<void> {
  const result = await fetchFeed(source.url, { etag: source.etag, lastModified: source.lastModified });

  if (result.notModified) {
    summary.notModified += 1;
    await updateSourceFetchMeta(db, source.id, { etag: source.etag, lastModified: source.lastModified });
    return;
  }

  summary.fetched += 1;
  await insertItems(db, source, result.items, summary);
  await updateSourceFetchMeta(db, source.id, { etag: result.etag, lastModified: result.lastModified });
}

async function collectBlueskySource(db: Db, source: Source, summary: CollectSummary): Promise<void> {
  const posts = await fetchBlueskyAuthorFeed(source.url);
  summary.fetched += 1;
  await insertItems(db, source, posts, summary);
  await updateSourceFetchMeta(db, source.id, { etag: null, lastModified: null });
}

async function collectHnSource(db: Db, source: Source, summary: CollectSummary): Promise<void> {
  const sinceUnixSeconds = source.lastFetchedAt
    ? Math.floor(new Date(source.lastFetchedAt).getTime() / 1000)
    : Math.floor(Date.now() / 1000) - 48 * 3600; // 初回は過去48時間分をさかのぼる

  const [trustedDomains, knownCandidateDomains] = await Promise.all([
    listTrustedDomains(db),
    listKnownCandidateDomains(db),
  ]);

  const { trustedItems, candidateDomains } = await scanHackerNews(
    sinceUnixSeconds,
    new Set(trustedDomains),
    DOMAIN_DENYLIST,
  );
  summary.fetched += 1;

  // HNが持つのはタイトルと投票数だけで記事生成の材料として薄いため、
  // リンク先(信頼済みドメインのみ)の本文を取得して置き換える。取得に失敗した場合は
  // 簡易メタ情報のまま続行する(取りこぼすよりはマシ)。
  const enriched: { link: string; title: string; contentText: string | null; isoDate: string | null }[] = [];
  for (const item of trustedItems) {
    try {
      const pageText = await fetchPageText(item.link);
      enriched.push({ ...item, contentText: pageText || item.contentText });
    } catch (err) {
      console.warn(`[collect] hn: failed to fetch page text for ${item.link}: ${(err as Error).message}`);
      enriched.push(item);
    }
    await sleep(300);
  }
  await insertItems(db, source, enriched, summary);

  // 信頼済みでない新規ドメインは収集先候補として提案する(コンテンツは収集しない)。
  // 既に候補済み(pending/approved/rejectedいずれか)のドメインは、対象サイトへの
  // 不要なリクエストを避けるためフィード自動検出を再実行しない。
  let feedDiscoveryAttempts = 0;
  for (const [domain, sampleUrl] of candidateDomains) {
    if (knownCandidateDomains.has(domain)) continue;

    // フィード自動検出(discoverFeed)は1ドメインあたり最大10リクエストかかるため上限を設ける。
    // 上限に達した後は候補自体をfeed未検出のまま先に記録し、次回以降の実行で再訪した際に埋める。
    let feed: { url: string; kind: "rss" | "atom" } | null = null;
    if (feedDiscoveryAttempts < MAX_FEED_DISCOVERY_PER_RUN) {
      feedDiscoveryAttempts += 1;
      try {
        feed = await discoverFeed(domain);
      } catch (err) {
        console.warn(`[collect] hn: feed discovery failed for ${domain}: ${(err as Error).message}`);
      }
    }

    try {
      await upsertSourceCandidate(db, {
        domain,
        sampleUrl,
        detectedFeedUrl: feed?.url ?? null,
        detectedFeedKind: feed?.kind ?? null,
      });
      summary.candidatesDiscovered += 1;
    } catch (err) {
      console.warn(`[collect] hn: failed to record source candidate ${domain}: ${(err as Error).message}`);
    }
    await sleep(300);
  }

  await updateSourceFetchMeta(db, source.id, { etag: null, lastModified: null });
}

export async function runCollect(): Promise<CollectSummary> {
  const db = createDb(env.DATABASE_URL);
  const summary: CollectSummary = {
    sourcesChecked: 0,
    fetched: 0,
    notModified: 0,
    inserted: 0,
    skipped: 0,
    candidatesDiscovered: 0,
    errors: [],
  };

  try {
    const sources = await listEnabledSources(db);

    for (const source of sources) {
      summary.sourcesChecked += 1;
      try {
        if (source.kind === "bluesky") {
          await collectBlueskySource(db, source, summary);
        } else if (source.kind === "hn_domain") {
          await collectHnSource(db, source, summary);
        } else {
          // rss / atom / github_releases はいずれもRSS/Atom形式で取得できる。
          await collectFeedSource(db, source, summary);
        }

        // 相手サーバへの負荷を抑えるため、ソース間で軽くsleepする(行儀のよい巡回)。
        await sleep(300);
      } catch (err) {
        // 1ソースの失敗が他のソースの収集に波及しないようにする。
        summary.errors.push({ source: source.name, message: (err as Error).message });
      }
    }
  } finally {
    await db.end({ timeout: 5 });
  }

  return summary;
}
