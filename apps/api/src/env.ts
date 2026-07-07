// dotenvによるファイル読み込みはNode実行時のみ有効(Cloudflare Workersにはファイルシステムが無い)。
// Workers環境ではこのブロックが例外を投げるか何もせず終わるが、それでよい
// (Workers側ではworker.tsがbindings経由でprocess.envへ値を設定する)。
try {
  const { config } = await import("dotenv");
  const { existsSync } = await import("node:fs");
  const { dirname, resolve } = await import("node:path");
  const { fileURLToPath } = await import("node:url");

  const here = dirname(fileURLToPath(import.meta.url));
  // リポジトリルートの .env を、実行時のcwd(リポジトリルート or apps/api)どちらからでも拾えるようにする。
  const candidates = [resolve(here, "../../../.env"), resolve(process.cwd(), ".env")];
  for (const path of candidates) {
    if (existsSync(path)) {
      config({ path });
      break;
    }
  }
} catch {
  // no-op
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/**
 * 各プロパティをgetterにして遅延評価する(モジュール読み込み時ではなく実際にアクセスされた時点でprocess.envを読む)。
 * Cloudflare Workersのbindings(env)はモジュールのトップレベルスコープでは参照できず、
 * fetch/scheduledハンドラの引数として渡されるため、worker.tsがハンドラ内でprocess.envへ
 * 値を代入してから既存のジョブ関数を呼び出す構成にしている。ここを即時評価(トップレベルconst)
 * のままにすると、Workers上ではモジュール読み込み時点でDATABASE_URL未設定エラーになってしまう。
 */
export const env = {
  get DATABASE_URL() {
    return requireEnv("DATABASE_URL");
  },
  get PORT() {
    return Number(process.env.PORT ?? 8787);
  },
  get IMPORTANCE_THRESHOLD() {
    return Number(process.env.IMPORTANCE_THRESHOLD ?? 60);
  },
  get CLASSIFY_BATCH_SIZE() {
    return Number(process.env.CLASSIFY_BATCH_SIZE ?? 30);
  },
  get MAX_GENERATE_PER_RUN() {
    return Number(process.env.MAX_GENERATE_PER_RUN ?? 10);
  },
};
