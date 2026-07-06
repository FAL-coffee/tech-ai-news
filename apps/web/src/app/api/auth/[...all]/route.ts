import { toNextJsHandler } from "better-auth/next-js";
import { getAuth } from "../../../../lib/auth";

// toNextJsHandlerはbetterAuthの実インスタンスを要求する(内部でthisバインディングに依存するため、
// Proxyでラップしたauthを渡すと壊れる。詳細はlib/auth.tsのコメント参照)。
export const { GET, POST } = toNextJsHandler(getAuth());
