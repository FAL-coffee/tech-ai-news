import { runClassify } from "./jobs/classify";
import { runCollect } from "./jobs/collect";
import { runDigest } from "./jobs/digest";
import { runGenerate } from "./jobs/generate";

let running = false;
let lastDigestDateJst: string | null = null;

function currentJst(): { dateKey: string; hour: number } {
  const jst = new Date(Date.now() + 9 * 3600 * 1000); // UTC+9(サーバーのタイムゾーンに依存しないよう明示的に加算)
  return { dateKey: jst.toISOString().slice(0, 10), hour: jst.getUTCHours() };
}

/**
 * ダイジェスト配信は1日1回のみ送りたいが、この関数はcollect/classify/generateと同じ
 * ポーリング間隔(デフォルト30分)のtick内で呼ばれる。狙った時刻(JST)を含むtickでのみ、
 * かつ同じ日にまだ送っていなければ送信する(lastDigestDateJstで多重送信を防ぐ)。
 */
async function maybeRunDigest(): Promise<void> {
  const digestEnabled = (process.env.DIGEST_ENABLED ?? "false").toLowerCase() === "true";
  if (!digestEnabled) return;

  const digestHour = Math.max(0, Math.min(23, Number(process.env.DIGEST_HOUR_JST ?? 7)));
  const { dateKey, hour } = currentJst();
  if (hour !== digestHour || lastDigestDateJst === dateKey) return;

  lastDigestDateJst = dateKey;
  console.log(`[scheduler] digest: sending for ${dateKey} (JST ${hour}時台)`);
  try {
    const digestSummary = await runDigest();
    console.log("[scheduler] digest:", JSON.stringify(digestSummary));
  } catch (err) {
    console.error("[scheduler] digest run failed", err);
  }
}

async function tick(): Promise<void> {
  if (running) {
    console.log("[scheduler] previous run still in progress, skipping this tick");
    return;
  }
  running = true;
  console.log(`[scheduler] pipeline run started at ${new Date().toISOString()}`);
  try {
    const collectSummary = await runCollect();
    console.log("[scheduler] collect:", JSON.stringify(collectSummary));

    const classifySummary = await runClassify();
    console.log("[scheduler] classify:", JSON.stringify(classifySummary));

    const generateSummary = await runGenerate();
    console.log("[scheduler] generate:", JSON.stringify(generateSummary));

    await maybeRunDigest();
  } catch (err) {
    console.error("[scheduler] pipeline run failed", err);
  } finally {
    running = false;
    console.log(`[scheduler] pipeline run finished at ${new Date().toISOString()}`);
  }
}

/**
 * apps/api プロセスが起動している間、collect→classify→generate(→条件付きでdigest)を
 * 一定間隔で自動実行する(Cloudflare Workers Cron Triggers 等の実デプロイ環境が用意できるまでの「動くCron」)。
 *
 * デフォルトは無効: 有効化すると実際にAnthropic/OpenAIのAPI課金が発生するジョブが定期実行される
 * ため、明示的なopt-in(SCHEDULER_ENABLED=true)を必須にしている。
 * メールダイジェスト配信はユーザーへの実送信を伴うため、SCHEDULER_ENABLEDに加えて
 * DIGEST_ENABLED=true も別途必要(二重の明示的opt-in)。
 */
export function startScheduler(): void {
  const enabled = (process.env.SCHEDULER_ENABLED ?? "false").toLowerCase() === "true";
  if (!enabled) {
    console.log("[scheduler] disabled (SCHEDULER_ENABLED=true で有効化できます)");
    return;
  }

  const intervalMinutes = Math.max(1, Number(process.env.COLLECT_INTERVAL_MINUTES ?? 30));
  const intervalMs = intervalMinutes * 60 * 1000;
  const runOnStart = (process.env.SCHEDULER_RUN_ON_START ?? "false").toLowerCase() === "true";

  console.log(`[scheduler] enabled: pipeline will run every ${intervalMinutes} minute(s)`);

  if (runOnStart) {
    void tick();
  }
  setInterval(() => {
    void tick();
  }, intervalMs);
}
