import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// リポジトリルートの .env を、実行時のcwd(リポジトリルート or apps/api)どちらからでも拾えるようにする。
const candidates = [resolve(here, "../../../.env"), resolve(process.cwd(), ".env")];

for (const path of candidates) {
  if (existsSync(path)) {
    config({ path });
    break;
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  PORT: Number(process.env.PORT ?? 8787),
  IMPORTANCE_THRESHOLD: Number(process.env.IMPORTANCE_THRESHOLD ?? 60),
  CLASSIFY_BATCH_SIZE: Number(process.env.CLASSIFY_BATCH_SIZE ?? 50),
  MAX_GENERATE_PER_RUN: Number(process.env.MAX_GENERATE_PER_RUN ?? 10),
};
