import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { Lang } from "@tech-ai-news/shared";
import { anthropic } from "./client";
import { buildGenerationSystemPrompt } from "./prompts";
import { ArticleLanguageSchema } from "./schemas";

export interface GenerateInput {
  sourceName: string;
  title: string;
  url: string;
  contentText: string;
  publishedAt?: string | null;
}

export interface GeneratedArticle {
  titleJa: string;
  titleEn: string;
  summaryJa: string;
  summaryEn: string;
  bodyJa: string;
  bodyEn: string;
  tags: string[];
}

const MAX_CONTENT_CHARS = 20000;

async function generateForLang(input: GenerateInput, lang: Lang, model: string) {
  const userContent = [
    `出典: ${input.sourceName}`,
    `原文URL: ${input.url}`,
    `原文タイトル: ${input.title}`,
    input.publishedAt ? `公開日: ${input.publishedAt}` : null,
    "",
    `原文本文:\n${input.contentText.slice(0, MAX_CONTENT_CHARS)}`,
  ]
    .filter((line): line is string => line !== null)
    .join("\n");

  // Sonnet 5 は temperature/top_p/top_k を一切渡さない(非デフォルト値は400)。
  // thinking は省略(Sonnet 5は省略時にadaptiveがデフォルトで適用される)。
  const response = await anthropic.messages.parse({
    model,
    max_tokens: 16000,
    system: buildGenerationSystemPrompt(lang),
    messages: [{ role: "user", content: userContent }],
    output_config: { format: zodOutputFormat(ArticleLanguageSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error(`generateArticle: failed to parse ${lang} output for "${input.title}"`);
  }
  return parsed;
}

export async function generateArticle(
  input: GenerateInput,
  opts: { model?: string } = {},
): Promise<GeneratedArticle> {
  const model = opts.model ?? process.env.GENERATE_MODEL ?? "claude-sonnet-5";

  const [ja, en] = await Promise.all([
    generateForLang(input, "ja", model),
    generateForLang(input, "en", model),
  ]);

  return {
    titleJa: ja.title,
    titleEn: en.title,
    summaryJa: ja.summary,
    summaryEn: en.summary,
    bodyJa: ja.body,
    bodyEn: en.body,
    tags: Array.from(new Set([...ja.tags, ...en.tags])).slice(0, 6),
  };
}
