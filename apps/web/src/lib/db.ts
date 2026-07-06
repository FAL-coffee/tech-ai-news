import { createDb } from "@tech-ai-news/db";

type DbClient = ReturnType<typeof createDb>;

// dev の Hot Module Reload で接続プールが増殖しないよう globalThis にキャッシュする。
declare global {
  // eslint-disable-next-line no-var
  var __techAiNewsDb__: DbClient | undefined;
}

export function getDb(): DbClient {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("Missing required environment variable: DATABASE_URL");
  }
  if (!globalThis.__techAiNewsDb__) {
    globalThis.__techAiNewsDb__ = createDb(url);
  }
  return globalThis.__techAiNewsDb__;
}
