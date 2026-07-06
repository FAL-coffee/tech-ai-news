import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { getAnthropic } from "./client";
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
  title: string;
  summary: string;
  body: string;
  tags: string[];
}

const MAX_CONTENT_CHARS = 20000;

export async function generateArticle(
  input: GenerateInput,
  opts: { model?: string } = {},
): Promise<GeneratedArticle> {
  const model = opts.model ?? process.env.GENERATE_MODEL ?? "claude-sonnet-5";

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
  const response = await getAnthropic().messages.parse({
    model,
    max_tokens: 16000,
    system: buildGenerationSystemPrompt(),
    messages: [{ role: "user", content: userContent }],
    output_config: { format: zodOutputFormat(ArticleLanguageSchema) },
  });

  const parsed = response.parsed_output;
  if (!parsed) {
    throw new Error(`generateArticle: failed to parse output for "${input.title}"`);
  }

  return {
    title: parsed.title,
    summary: parsed.summary,
    body: parsed.body,
    tags: parsed.tags,
  };
}
