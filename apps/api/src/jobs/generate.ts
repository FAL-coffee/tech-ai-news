import { createDb, insertArticleWithTopics, listSelectedRawItems, recordRawItemError } from "@tech-ai-news/db";
import { embedText, generateArticle } from "@tech-ai-news/llm";
import { env } from "../env";
import { slugify } from "../lib/slug";

export interface GenerateSummary {
  processed: number;
  generated: number;
  errors: { id: string; title: string; message: string }[];
}

export async function runGenerate(): Promise<GenerateSummary> {
  const db = createDb(env.DATABASE_URL);
  const summary: GenerateSummary = { processed: 0, generated: 0, errors: [] };

  try {
    const items = await listSelectedRawItems(db, env.MAX_GENERATE_PER_RUN);

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

        const embedding = await embedText(`${article.titleEn}\n${article.summaryEn}`);
        const slug = `${slugify(article.titleEn)}-${item.id.slice(0, 6)}`;

        await insertArticleWithTopics(db, {
          rawItemId: item.id,
          slug,
          titleJa: article.titleJa,
          titleEn: article.titleEn,
          summaryJa: article.summaryJa,
          summaryEn: article.summaryEn,
          bodyJa: article.bodyJa,
          bodyEn: article.bodyEn,
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
        await recordRawItemError(db, item.id, (err as Error).message);
        summary.errors.push({ id: item.id, title: item.title, message: (err as Error).message });
      }
    }
  } finally {
    await db.end({ timeout: 5 });
  }

  return summary;
}
