import { z } from "zod";
import { getAnthropic } from "./client";
import { buildTrendDiscoveryPrompt } from "./prompts";

const TrendCandidateSchema = z.object({
  name: z.string(),
  homepageUrl: z.string(),
  githubOrgRepo: z.string().nullable(),
});

export type TrendCandidate = z.infer<typeof TrendCandidateSchema>;

function parseTrendCandidates(text: string): TrendCandidate[] {
  const match = text.match(/\[[\s\S]*\]/);
  if (!match) return [];
  try {
    const parsed = JSON.parse(match[0]);
    const result = z.array(TrendCandidateSchema).safeParse(parsed);
    return result.success ? result.data : [];
  } catch {
    return [];
  }
}

/**
 * web_search toolを使って、話題の著名な技術(言語・フレームワーク・ライブラリ等)を調査する。
 * 検索自体・結果の裏取り(フィードが実在するか等)は呼び出し側(apps/api)の責務。
 */
export async function discoverTrendingTech(
  existingSourceNames: string[],
  opts: { model?: string } = {},
): Promise<TrendCandidate[]> {
  const model = opts.model ?? process.env.TRENDS_MODEL ?? "claude-sonnet-5";

  const response = await getAnthropic().messages.create({
    model,
    // web_search toolは検索クエリの組み立て・実行・要約に多くのトークンを使うため、
    // 4096程度では最終的なJSON出力の直前でmax_tokensに達して切れることがある。
    max_tokens: 16000,
    tools: [{ type: "web_search_20260318", name: "web_search", max_uses: 5 }],
    messages: [{ role: "user", content: buildTrendDiscoveryPrompt(existingSourceNames) }],
  });

  const text = response.content
    .filter((block): block is Extract<typeof block, { type: "text" }> => block.type === "text")
    .map((block) => block.text)
    .join("\n");

  if (response.stop_reason === "max_tokens") {
    console.warn("[discoverTrendingTech] response truncated at max_tokens before completing");
  }

  return parseTrendCandidates(text);
}
