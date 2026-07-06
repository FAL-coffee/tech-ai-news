import { createDb, insertRawItem, listEnabledSources, updateSourceFetchMeta } from "@tech-ai-news/db";
import type { Db } from "@tech-ai-news/db";
import type { Source } from "@tech-ai-news/shared";
import { env } from "../env";
import { fetchBlueskyAuthorFeed } from "../lib/bluesky";
import { fetchFeed } from "../lib/feed";
import { fetchHackerNewsForTrustedDomains } from "../lib/hackernews";
import { sha256 } from "../lib/hash";
import { fetchPageText } from "../lib/pageContent";
import { TRUSTED_HN_DOMAINS } from "../lib/trustedDomains";

export interface CollectSummary {
  sourcesChecked: number;
  fetched: number;
  notModified: number;
  inserted: number;
  skipped: number;
  errors: { source: string; message: string }[];
}

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

async function collectHnSource(
  db: Db,
  source: Source,
  summary: CollectSummary,
  trustedDomains: ReadonlySet<string>,
): Promise<void> {
  const sinceUnixSeconds = source.lastFetchedAt
    ? Math.floor(new Date(source.lastFetchedAt).getTime() / 1000)
    : Math.floor(Date.now() / 1000) - 48 * 3600; // 初回は過去48時間分をさかのぼる

  const items = await fetchHackerNewsForTrustedDomains(sinceUnixSeconds, trustedDomains);
  summary.fetched += 1;

  // HNが持つのはタイトルと投票数だけで記事生成の材料として薄いため、
  // リンク先(信頼済みドメインのみ)の本文を取得して置き換える。取得に失敗した場合は
  // 簡易メタ情報のまま続行する(取りこぼすよりはマシ)。
  const enriched: { link: string; title: string; contentText: string | null; isoDate: string | null }[] = [];
  for (const item of items) {
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
    errors: [],
  };

  try {
    const sources = await listEnabledSources(db);

    // HN経由の発見を許可するドメインは、あらかじめ許可した一次情報ドメインのみ
    // (docs/spec.md §9)。sourcesテーブルの内容に依存させず、明示的な allowlist を使う。
    const trustedDomains = TRUSTED_HN_DOMAINS;

    for (const source of sources) {
      summary.sourcesChecked += 1;
      try {
        if (source.kind === "bluesky") {
          await collectBlueskySource(db, source, summary);
        } else if (source.kind === "hn_domain") {
          await collectHnSource(db, source, summary, trustedDomains);
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
