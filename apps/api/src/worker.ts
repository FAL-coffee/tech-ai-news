/// <reference types="@cloudflare/workers-types" />
import app from "./app";
import { runClassify } from "./jobs/classify";
import { runCollect } from "./jobs/collect";
import { runDigest } from "./jobs/digest";
import { runGenerate } from "./jobs/generate";

// wrangler.tomlのcron設定と対応する値。ダイジェスト送信専用のcronだけを識別するために使う。
const DIGEST_CRON = "0 22 * * *"; // UTC 22:00 = JST 7:00

export interface WorkerBindings {
  DATABASE_URL?: string;
  HYPERDRIVE?: { connectionString: string };
  [key: string]: unknown;
}

/**
 * Cloudflare Workersのbindings(env)はモジュールのトップレベルスコープでは参照できず、
 * fetch/scheduledハンドラの引数として都度渡される。既存のジョブ実装はprocess.env経由で
 * シークレットを読む前提のまま(env.ts参照)にしているため、各ハンドラの先頭でここを呼び、
 * process.envへ橋渡しする。
 */
function applyEnvBindings(bindings: WorkerBindings): void {
  const databaseUrl = bindings.HYPERDRIVE?.connectionString ?? bindings.DATABASE_URL;
  if (databaseUrl) process.env.DATABASE_URL = databaseUrl;

  for (const [key, value] of Object.entries(bindings)) {
    if (key === "DATABASE_URL" || key === "HYPERDRIVE") continue;
    if (typeof value === "string") process.env[key] = value;
  }
}

export default {
  async fetch(request: Request, bindings: WorkerBindings, ctx: ExecutionContext): Promise<Response> {
    applyEnvBindings(bindings);
    return app.fetch(request, bindings, ctx);
  },

  async scheduled(event: ScheduledController, bindings: WorkerBindings, ctx: ExecutionContext): Promise<void> {
    applyEnvBindings(bindings);

    if (event.cron === DIGEST_CRON) {
      ctx.waitUntil(runDigest());
      return;
    }

    ctx.waitUntil(
      (async () => {
        await runCollect();
        await runClassify();
        await runGenerate();
      })(),
    );
  },
};
