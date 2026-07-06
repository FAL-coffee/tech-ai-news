import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import type { NextConfig } from "next";

// Next.js自身は apps/web/.env しか自動で読まないため、モノレポルートの .env をここで読み込む。
// 存在しない場合は何もしない(本番デプロイ時はホスティング側の環境変数injectionに任せる)。
const rootEnvPath = resolve(process.cwd(), "../../.env");
if (existsSync(rootEnvPath)) {
  config({ path: rootEnvPath });
}

// `pnpm dev`(通常のnext dev)でもwrangler.jsoncのvars/bindingsをローカルで参照できるようにする
// (Cloudflare公式の推奨手順)。Cloudflare以外の環境で実行してもこの呼び出し自体は無害。
// next.config.tsはNext.js内部でrequire()されるため、トップレベルawaitは使えない(.then()で非同期に実行)。
if (process.env.NODE_ENV === "development") {
  import("@opennextjs/cloudflare").then(({ initOpenNextCloudflareForDev }) => {
    void initOpenNextCloudflareForDev();
  });
}

const nextConfig: NextConfig = {
  transpilePackages: ["@tech-ai-news/db", "@tech-ai-news/shared"],
  serverExternalPackages: ["postgres"],
  // pnpmモノレポではワークスペースルート外(node_modules等)のファイルもトレース対象にする必要がある。
  // 未設定だとビルド出力の依存関係解析がapps/web単体を起点にしてしまい、Cloudflare(OpenNext)
  // ビルドでmiddleware-manifest.json等の解決に失敗する原因になる。
  outputFileTracingRoot: resolve(process.cwd(), "../.."),
};

export default nextConfig;
