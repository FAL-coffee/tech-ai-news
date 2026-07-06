import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";
import { getResend } from "./resend";

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
      sendResetPassword: async ({ user, url }) => {
        await getResend().emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev",
          to: user.email,
          subject: "【tech/ai news】パスワード再設定のご案内",
          html: `
            <p>パスワードの再設定リクエストを受け付けました。</p>
            <p>下記のリンクから新しいパスワードを設定してください(このリンクの有効期限は1時間です)。</p>
            <p><a href="${url}">パスワードを再設定する</a></p>
            <p>このリクエストに心当たりがない場合は、このメールを無視してください。</p>
          `,
        });
      },
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
