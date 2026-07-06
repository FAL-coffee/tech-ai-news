import { runClassify } from "./jobs/classify";
import { runCollect } from "./jobs/collect";
import { runGenerate } from "./jobs/generate";

let running = false;

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
  } catch (err) {
    console.error("[scheduler] pipeline run failed", err);
  } finally {
    running = false;
    console.log(`[scheduler] pipeline run finished at ${new Date().toISOString()}`);
  }
}

/**
 * apps/api プロセスが起動している間、collect→classify→generate を一定間隔で自動実行する
 * (Cloudflare Workers Cron Triggers 等の実デプロイ環境が用意できるまでの「動くCron」)。
 *
 * デフォルトは無効: 有効化すると実際にAnthropic/OpenAIのAPI課金が発生するジョブが定期実行される
 * ため、明示的なopt-in(SCHEDULER_ENABLED=true)を必須にしている。
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
