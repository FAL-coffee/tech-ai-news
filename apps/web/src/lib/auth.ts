import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

function createAuth() {
  return betterAuth({
    database: new Pool({
      // pg.Pool は接続文字列が未設定でも構築時には例外を投げない(実際に接続する際に失敗する)。
      connectionString: process.env.DATABASE_URL,
    }),
    baseURL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    secret: process.env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
    },
    plugins: [nextCookies()],
  });
}

type Auth = ReturnType<typeof createAuth>;

let cached: Auth | null = null;

/**
 * モジュール読み込み時ではなく初回利用時に生成する(getDb()/getStripe()と同じ遅延初期化の方針)。
 * Cloudflare Workers(OpenNext)ではbindings経由の環境変数がモジュールのトップレベルスコープでは
 * まだ反映されていないため、即座にbetterAuth({...})を評価すると誤った値で初期化されてしまう。
 */
/**
 * betterAuthの実インスタンスをそのまま必要とする呼び出し(toNextJsHandler等、内部でthisバインディングに
 * 依存する場合がある)はこちらを使う。プロパティアクセスの都度getAuth()を呼ぶProxyでラップすると、
 * メソッド抽出時にthisが失われて実行時エラーになることがある(実際にサインアップAPIで発生した)。
 */
export function getAuth(): Auth {
  if (!cached) {
    cached = createAuth();
  }
  return cached;
}

export const auth: Auth = new Proxy({} as Auth, {
  get(_target, prop) {
    return getAuth()[prop as keyof Auth];
  },
});
