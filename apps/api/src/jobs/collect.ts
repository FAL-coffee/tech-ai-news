import { createDb, insertRawItem, listEnabledSources, updateSourceFetchMeta } from "@tech-ai-news/db";
import { env } from "../env";
import { fetchFeed } from "../lib/feed";
import { sha256 } from "../lib/hash";

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

    for (const source of sources) {
      summary.sourcesChecked += 1;
      try {
        const result = await fetchFeed(source.url, {
          etag: source.etag,
          lastModified: source.lastModified,
        });

        if (result.notModified) {
          summary.notModified += 1;
          await updateSourceFetchMeta(db, source.id, {
            etag: source.etag,
            lastModified: source.lastModified,
          });
          continue;
        }

        summary.fetched += 1;

        for (const item of result.items) {
          if (!item.link) continue;
          const contentHash = sha256(`${item.link}\n${item.title}\n${item.contentText}`);
          const inserted = await insertRawItem(db, {
            sourceId: source.id,
            externalUrl: item.link,
            title: item.title,
            contentText: item.contentText || null,
            contentHash,
            publishedAt: item.isoDate,
          });
          if (inserted) summary.inserted += 1;
          else summary.skipped += 1;
        }

        await updateSourceFetchMeta(db, source.id, {
          etag: result.etag,
          lastModified: result.lastModified,
        });

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
