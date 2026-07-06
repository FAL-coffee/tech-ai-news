import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic } from "./client";
import { CLASSIFY_SYSTEM_PROMPT } from "./prompts";
import { buildClassificationSchema } from "./schemas";

export interface ClassifyInput {
  sourceName: string;
  title: string;
  url: string;
  contentText: string;
}

export interface SuggestedTopic {
  slug: string;
  nameJa: string;
  nameEn: string;
  reason: string;
}

export interface ClassificationResult {
  importance: number;
  worthArticle: boolean;
  topics: { slug: string; score: number }[];
  reason: string;
  suggestedTopic: SuggestedTopic | null;
}

const MAX_CONTENT_CHARS = 4000;

export async function classifyItem(
  input: ClassifyInput,
  topicSlugs: string[],
  opts: { model?: string } = {},
): Promise<ClassificationResult> {
  const model = opts.model ?? process.env.CLASSIFY_MODEL ?? "claude-haiku-4-5";
  const schema = buildClassificationSchema(topicSlugs);
  const sortedSlugs = [...topicSlugs].sort();

  const userContent = [
    `出典: ${input.sourceName}`,
    `URL: ${input.url}`,
    `タイトル: ${input.title}`,
    "",
    `本文:\n${input.contentText.slice(0, MAX_CONTENT_CHARS)}`,
    "",
    `利用可能なトピックスラッグ: ${sortedSlugs.join(", ")}`,
  ].join("\n");

  // Haiku 4.5 は effort / thinking 未対応のため一切設定しない。
  const response = await getAnthropic().messages.parse({
    model,
    max_tokens: 1024,
    system: CLASSIFY_SYSTEM_PROMPT,
    messages: [{ role: "user", content: userContent }],
    output_config: { format: zodOutputFormat(schema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error(`classifyItem: failed to parse structured output for "${input.title}"`);
  }

  return {
    importance: parsed.importance,
    worthArticle: parsed.worth_article,
    topics: parsed.topics,
    reason: parsed.reason,
    suggestedTopic: parsed.suggested_topic
      ? {
          slug: parsed.suggested_topic.slug,
          nameJa: parsed.suggested_topic.name_ja,
          nameEn: parsed.suggested_topic.name_en,
          reason: parsed.suggested_topic.reason,
        }
      : null,
  };
}
