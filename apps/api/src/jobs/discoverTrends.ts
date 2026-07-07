import { createDb, insertSource, listAllSourceNames } from "@tech-ai-news/db";
import type { Db } from "@tech-ai-news/db";
import { discoverTrendingTech } from "@tech-ai-news/llm";
import { env } from "../env";
import { DOMAIN_DENYLIST } from "../lib/domainDenylist";
import { discoverFeed, verifyFeedUrl } from "../lib/feedDiscovery";
import { hostnameOf } from "../lib/hackernews";

export interface DiscoverTrendsSummary {
  candidatesFound: number;
  sourcesAdded: number;
  skipped: { name: string; reason: string }[];
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * AI(web検索)で話題の技術を調査し、公式ブログ/リリースノートのフィードが実在すると確認できたものだけを
 * 収集先候補(source_candidates)を介さず直接sourcesへ追加する。フィードが見つからないものは追加しない
 * (この関数はcollect/classify/generateとは別の、数日おきのcron専用ジョブ)。
 */
export async function runDiscoverTrends(db?: Db): Promise<DiscoverTrendsSummary> {
  const ownDb = db ?? createDb(env.DATABASE_URL);
  const summary: DiscoverTrendsSummary = { candidatesFound: 0, sourcesAdded: 0, skipped: [] };

  try {
    const existingNames = await listAllSourceNames(ownDb);
    const candidates = await discoverTrendingTech(existingNames);
    summary.candidatesFound = candidates.length;

    for (const candidate of candidates) {
      try {
        const homepageDomain = hostnameOf(candidate.homepageUrl);
        if (homepageDomain && DOMAIN_DENYLIST.has(homepageDomain)) {
          summary.skipped.push({ name: candidate.name, reason: "denylisted domain" });
          continue;
        }

        let feedUrl: string | null = null;
        let feedKind: "rss" | "atom" | "github_releases" | null = null;

        if (candidate.githubOrgRepo) {
          const ghFeed = await verifyFeedUrl(`https://github.com/${candidate.githubOrgRepo}/releases.atom`);
          if (ghFeed) {
            feedUrl = ghFeed.url;
            feedKind = "github_releases";
          }
        }
        if (!feedUrl && homepageDomain) {
          const found = await discoverFeed(homepageDomain);
          if (found) {
            feedUrl = found.url;
            feedKind = found.kind;
          }
        }

        if (!feedUrl || !feedKind) {
          summary.skipped.push({ name: candidate.name, reason: "no verifiable feed found" });
          continue;
        }

        const { inserted } = await insertSource(ownDb, { name: candidate.name, kind: feedKind, url: feedUrl });
        if (inserted) summary.sourcesAdded += 1;
        else summary.skipped.push({ name: candidate.name, reason: "already exists" });
      } catch (err) {
        summary.skipped.push({ name: candidate.name, reason: (err as Error).message });
      }
      await sleep(300);
    }
  } finally {
    if (!db) await ownDb.end({ timeout: 5 });
  }

  return summary;
}
