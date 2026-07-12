/// <reference types="@cloudflare/workers-types" />
import app from "./app";
import { runCheckVulnerabilities } from "./jobs/checkVulnerabilities";
import { runClassify } from "./jobs/classify";
import { runCollect } from "./jobs/collect";
import { runDigest } from "./jobs/digest";
import { runDiscoverTrends } from "./jobs/discoverTrends";
import { runGenerate } from "./jobs/generate";
import { runWeeklyDigest } from "./jobs/weeklyDigest";

// wrangler.tomlのcron設定と対応する値。それぞれ独立したCloudflare Workers実行(1回あたり外部
// リクエスト50件の上限を持つ)として動かすことで、各フェーズが自分専用の予算を持つようにする。
// collect→classify→generateを1回の実行内で連続実行していた頃は、sources件数の増加でcollectが
// 予算の大半を使い切り、後続のclassify/generateが「Too many subrequests」で失敗する事故があった。
const COLLECT_CRON = "0,30 * * * *";
const CLASSIFY_CRON = "10,40 * * * *";
const GENERATE_CRON = "20,50 * * * *";
const DIGEST_CRON = "0 22 * * *"; // UTC 22:00 = JST 7:00
const DISCOVER_TRENDS_CRON = "0 3 */3 * *"; // 3日おき UTC 3:00 = JST 12:00

const JST_OFFSET_MS = 9 * 3600 * 1000;

/** Cloudflare Workers Cron Triggersはアカウントあたり5個までのため、週次まとめ・CVEチェックは
 * 新しいcronを追加せず、既存のDIGEST_CRON(毎朝7:00 JST)実行に相乗りさせる。 */
function isJstMonday(scheduledTime: number): boolean {
  return new Date(scheduledTime + JST_OFFSET_MS).getUTCDay() === 1;
}

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

    switch (event.cron) {
      case DIGEST_CRON:
        ctx.waitUntil(
          runDigest()
            .then((summary) => console.log("[scheduled] runDigest:", JSON.stringify(summary)))
            .catch((err) => console.error("[scheduled] runDigest failed", err)),
        );
        // CVEチェックは毎朝の枠に相乗りさせる(1日1回で足りる即時性)。
        ctx.waitUntil(
          runCheckVulnerabilities().catch((err) => console.error("[scheduled] runCheckVulnerabilities failed", err)),
        );
        // 週次まとめは同じ枠のうちJST月曜の回だけ実行する。
        if (isJstMonday(event.scheduledTime)) {
          ctx.waitUntil(
            runWeeklyDigest()
              .then((summary) => console.log("[scheduled] runWeeklyDigest:", JSON.stringify(summary)))
              .catch((err) => console.error("[scheduled] runWeeklyDigest failed", err)),
          );
        }
        return;
      case DISCOVER_TRENDS_CRON:
        ctx.waitUntil(runDiscoverTrends().catch((err) => console.error("[scheduled] runDiscoverTrends failed", err)));
        return;
      case CLASSIFY_CRON:
        ctx.waitUntil(runClassify().catch((err) => console.error("[scheduled] runClassify failed", err)));
        return;
      case GENERATE_CRON:
        ctx.waitUntil(runGenerate().catch((err) => console.error("[scheduled] runGenerate failed", err)));
        return;
      case COLLECT_CRON:
      default:
        // COLLECT_CRONを既定の枝にしておく(wrangler.tomlのcrons配列に文字列が重複した場合の保険)。
        ctx.waitUntil(runCollect().catch((err) => console.error("[scheduled] runCollect failed", err)));
    }
  },
};
