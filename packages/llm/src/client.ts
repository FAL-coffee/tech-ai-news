import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// 認証情報は環境変数(ANTHROPIC_API_KEY / OPENAI_API_KEY)から自動解決される。
// モジュール読み込み時ではなく初回利用時に生成する(Cloudflare Workers対策。bindings経由の
// 環境変数はモジュールのトップレベルスコープでは参照できないため、即時にnew ...()すると
// Worker起動時点でAPIキー未設定エラーになってしまう)。
let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

export function getAnthropic(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic();
  }
  return anthropicClient;
}

export function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI();
  }
  return openaiClient;
}
