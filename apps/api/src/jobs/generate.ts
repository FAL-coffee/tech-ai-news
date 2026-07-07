import { createDb, insertArticleWithTopics, listSelectedRawItems, recordRawItemError } from "@tech-ai-news/db";
import type { Db } from "@tech-ai-news/db";
import { embedText, generateArticle } from "@tech-ai-news/llm";
import { env } from "../env";
import { fetchOgImage } from "../lib/ogImage";
import { slugify } from "../lib/slug";

export interface GenerateSummary {
  processed: number;
  generated: number;
  errors: { id: string; title: string; message: string }[];
}

/**
 * dbを渡さない場合は自前で接続を作って閉じる(CLIスクリプト等の単独実行向け)。
 * 渡された場合は接続の開閉を呼び出し側に委ねる(worker.tsのscheduledハンドラのように
 * collect→classify→generateを1回の実行内で連続して呼ぶ場合、都度接続を開閉すると
 * Cloudflare Workers上でTCPソケットの再接続に失敗することがあるため、1本の接続を使い回す)。
 */
export async function runGenerate(db?: Db): Promise<GenerateSummary> {
  const ownDb = db ?? createDb(env.DATABASE_URL);
  const summary: GenerateSummary = { processed: 0, generated: 0, errors: [] };

  try {
    const items = await listSelectedRawItems(ownDb, env.MAX_GENERATE_PER_RUN);

    for (const item of items) {
      summary.processed += 1;
      try {
        const article = await generateArticle({
          sourceName: item.sourceName,
          title: item.title,
          url: item.externalUrl,
          contentText: item.contentText ?? "",
          publishedAt: item.publishedAt,
        });

        const [embedding, ogImageUrl] = await Promise.all([
          embedText(`${article.title}\n${article.summary}`),
          fetchOgImage(item.externalUrl),
        ]);
        // slugは生成された日本語タイトルではなく、原文(英語)タイトルから作る(slugifyは非ASCII文字を保持できない)。
        const slug = `${slugify(item.title)}-${item.id.slice(0, 6)}`;

        await insertArticleWithTopics(ownDb, {
          rawItemId: item.id,
          slug,
          title: article.title,
          summary: article.summary,
          body: article.body,
          highlight: article.highlight,
          ogImageUrl,
          // 法務ガードレール: 原文リンクと出典は必ずDBに保存する(UI側で必ず表示)。
          originalUrl: item.externalUrl,
          sourceName: item.sourceName,
          importance: item.importance ?? 0,
          model: process.env.GENERATE_MODEL ?? "claude-sonnet-5",
          embedding,
          topicSlugs: item.topics ?? [],
        });

        summary.generated += 1;
      } catch (err) {
        // status='selected' のまま残すことで次回実行時に自動リトライされる。
        await recordRawItemError(ownDb, item.id, (err as Error).message);
        summary.errors.push({ id: item.id, title: item.title, message: (err as Error).message });
      }
    }
  } finally {
    if (!db) await ownDb.end({ timeout: 5 });
  }

  return summary;
}
