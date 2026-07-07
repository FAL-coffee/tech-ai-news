import {
  createDb,
  listRawItemsByStatusWithSource,
  listTopicSlugs,
  recordRawItemError,
  updateRawItemClassification,
  upsertTopicCandidate,
} from "@tech-ai-news/db";
import { classifyItem, type SuggestedTopic } from "@tech-ai-news/llm";
import type { Db } from "@tech-ai-news/db";
import { env } from "../env";
import { slugify } from "../lib/slug";

export interface ClassifySummary {
  processed: number;
  selected: number;
  skipped: number;
  topicCandidatesDiscovered: number;
  errors: { id: string; title: string; message: string }[];
}

/**
 * LLMが提案した新規トピックを候補として保存する。既存スラッグとの重複や
 * 提案フォーマットの乱れはここで吸収し、失敗しても分類処理自体は失敗させない
 * (トピック提案はあくまで付加機能のため)。
 */
async function saveSuggestedTopic(
  db: Db,
  suggestion: SuggestedTopic,
  knownTopicSlugs: ReadonlySet<string>,
): Promise<boolean> {
  const slug = slugify(suggestion.slug);
  if (!slug || slug === "article" || knownTopicSlugs.has(slug)) return false;
  if (!suggestion.nameJa.trim() || !suggestion.nameEn.trim()) return false;

  await upsertTopicCandidate(db, {
    slug,
    nameJa: suggestion.nameJa,
    nameEn: suggestion.nameEn,
    reason: suggestion.reason,
  });
  return true;
}

/**
 * dbを渡さない場合は自前で接続を作って閉じる(CLIスクリプト等の単独実行向け)。
 * 渡された場合は接続の開閉を呼び出し側に委ねる(worker.tsのscheduledハンドラのように
 * collect→classify→generateを1回の実行内で連続して呼ぶ場合、都度接続を開閉すると
 * Cloudflare Workers上でTCPソケットの再接続に失敗することがあるため、1本の接続を使い回す)。
 */
export async function runClassify(db?: Db): Promise<ClassifySummary> {
  const ownDb = db ?? createDb(env.DATABASE_URL);
  const summary: ClassifySummary = {
    processed: 0,
    selected: 0,
    skipped: 0,
    topicCandidatesDiscovered: 0,
    errors: [],
  };

  try {
    const topicSlugs = await listTopicSlugs(ownDb);
    const knownTopicSlugs = new Set(topicSlugs);
    const items = await listRawItemsByStatusWithSource(ownDb, "new", env.CLASSIFY_BATCH_SIZE);

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
        await updateRawItemClassification(ownDb, item.id, {
          importance: result.importance,
          topics: result.topics.map((t) => t.slug),
          status: isSelected ? "selected" : "skipped",
        });

        if (isSelected) summary.selected += 1;
        else summary.skipped += 1;

        if (result.suggestedTopic) {
          try {
            const saved = await saveSuggestedTopic(ownDb, result.suggestedTopic, knownTopicSlugs);
            if (saved) summary.topicCandidatesDiscovered += 1;
          } catch (err) {
            console.warn(`[classify] failed to save suggested topic for "${item.title}": ${(err as Error).message}`);
          }
        }
      } catch (err) {
        // status='new' のまま残すことで次回実行時に自動リトライされる。
        await recordRawItemError(ownDb, item.id, (err as Error).message);
        summary.errors.push({ id: item.id, title: item.title, message: (err as Error).message });
      }
    }
  } finally {
    if (!db) await ownDb.end({ timeout: 5 });
  }

  return summary;
}
