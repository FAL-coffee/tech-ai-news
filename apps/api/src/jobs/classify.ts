import {
  createDb,
  listRawItemsByStatusWithSource,
  listTopicSlugs,
  recordRawItemError,
  updateRawItemClassification,
} from "@tech-ai-news/db";
import { classifyItem } from "@tech-ai-news/llm";
import { env } from "../env";

export interface ClassifySummary {
  processed: number;
  selected: number;
  skipped: number;
  errors: { id: string; title: string; message: string }[];
}

export async function runClassify(): Promise<ClassifySummary> {
  const db = createDb(env.DATABASE_URL);
  const summary: ClassifySummary = { processed: 0, selected: 0, skipped: 0, errors: [] };

  try {
    const topicSlugs = await listTopicSlugs(db);
    const items = await listRawItemsByStatusWithSource(db, "new", env.CLASSIFY_BATCH_SIZE);

    for (const item of items) {
      summary.processed += 1;
      try {
        const result = await classifyItem(
          {
            sourceName: item.sourceName,
            title: item.title,
            url: item.externalUrl,
            contentText: item.contentText ?? "",
          },
          topicSlugs,
        );

        const isSelected = result.worthArticle && result.importance >= env.IMPORTANCE_THRESHOLD;
        await updateRawItemClassification(db, item.id, {
          importance: result.importance,
          topics: result.topics.map((t) => t.slug),
          status: isSelected ? "selected" : "skipped",
        });

        if (isSelected) summary.selected += 1;
        else summary.skipped += 1;
      } catch (err) {
        // status='new' のまま残すことで次回実行時に自動リトライされる。
        await recordRawItemError(db, item.id, (err as Error).message);
        summary.errors.push({ id: item.id, title: item.title, message: (err as Error).message });
      }
    }
  } finally {
    await db.end({ timeout: 5 });
  }

  return summary;
}
