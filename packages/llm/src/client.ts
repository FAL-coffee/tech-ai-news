import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";

// 認証情報は環境変数(ANTHROPIC_API_KEY / OPENAI_API_KEY)から自動解決される。
export const anthropic = new Anthropic();
export const openai = new OpenAI();
