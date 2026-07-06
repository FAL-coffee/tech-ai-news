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

const nextConfig: NextConfig = {
  transpilePackages: ["@tech-ai-news/db", "@tech-ai-news/shared"],
  serverExternalPackages: ["postgres"],
};

export default nextConfig;
