import { config } from "dotenv";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));

// リポジトリルートの .env を、実行時のcwd(リポジトリルート or packages/db)どちらからでも拾えるようにする。
const candidates = [resolve(here, "../../../.env"), resolve(process.cwd(), ".env")];

for (const path of candidates) {
  if (existsSync(path)) {
    config({ path });
    break;
  }
}

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}
