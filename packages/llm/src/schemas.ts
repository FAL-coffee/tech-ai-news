import { z } from "zod";

function nonEmptyTuple(values: string[]): [string, ...string[]] {
  if (values.length === 0) {
    throw new Error("topic slug list must not be empty (seed the topics table first)");
  }
  return values as [string, ...string[]];
}

/**
 * topicSlugs はソートしてから enum を構築する — structured outputs のスキーマは
 * バイト単位で一致した場合のみ24時間キャッシュが効くため、呼び出しごとの順序を安定させる。
 */
const TopicSuggestionSchema = z.object({
  slug: z.string(),
  name_ja: z.string(),
  name_en: z.string(),
  reason: z.string(),
});

export function buildClassificationSchema(topicSlugs: string[]) {
  const sorted = [...topicSlugs].sort();
  return z.object({
    importance: z.number().int().min(0).max(100),
    worth_article: z.boolean(),
    topics: z
      .array(
        z.object({
          slug: z.enum(nonEmptyTuple(sorted)),
          score: z.number().min(0).max(1),
        }),
      )
      .max(5),
    reason: z.string(),
    // 既存トピックのどれも合わない場合にのみ、新規トピックの候補を提案する(合わなければnull)。
    suggested_topic: TopicSuggestionSchema.nullable(),
  });
}

export const ArticleLanguageSchema = z.object({
  title: z.string(),
  summary: z.string(),
  body: z.string(),
  // 記事の最重要ポイントを1文で表す「ワンポイント要約」。記事上部にハイライト表示する。
  highlight: z.string(),
  tags: z.array(z.string()).min(3).max(6),
});

export type ArticleLanguageResult = z.infer<typeof ArticleLanguageSchema>;
