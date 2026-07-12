import {
  claimVulnerabilityAlertDelivery,
  createDb,
  insertVulnerabilityAlertIfNew,
  listTopicFollowersForTopic,
  listTopicPackageMappings,
} from "@tech-ai-news/db";
import { env } from "../env";
import { queryOsvForPackage } from "../lib/osv";
import { getResend } from "../lib/resend";
import { sendSlackText } from "../lib/slack";

export interface CheckVulnerabilitiesSummary {
  packagesChecked: number;
  newAlerts: number;
  emailsSent: number;
  errors: { context: string; message: string }[];
}

// 初回実行時に何年も前のCVEを大量に「新規アラート」扱いしないための遡り期間。
// cronは1日複数回走らせる想定なので、これより狭めると実行間隔の隙間で見逃しうる。
const LOOKBACK_DAYS = 3;

function severityEmoji(severity: string | null): string {
  const s = (severity ?? "").toUpperCase();
  if (s.includes("CRITICAL")) return "🔴";
  if (s.includes("HIGH")) return "🟠";
  if (s.includes("MODERATE") || s.includes("MEDIUM")) return "🟡";
  return "⚪";
}

function buildAlertHtml(packageName: string, summary: string, severity: string | null, detailsUrl: string): string {
  return `
    <div style="font-family: Helvetica, Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 16px;">
      <p style="font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#a63e0f;">
        Vulnerability Alert
      </p>
      <h1 style="font-size:20px;">${severityEmoji(severity)} ${packageName} に新しい脆弱性情報</h1>
      <p style="color:#6b6355; line-height:1.6;">${summary}</p>
      <p><a href="${detailsUrl}" style="color:#a63e0f; font-weight:700;">詳細を確認する(OSV.dev) →</a></p>
      <p style="color:#968f7d; font-size:12px; margin-top:24px;">
        このメールは、あなたが興味のあるトピックとして登録している ${packageName} に関する脆弱性情報をOSV.dev(オープンソース脆弱性データベース)から検知したため送信しています。
      </p>
    </div>
  `;
}

/**
 * ユーザーが興味のあるトピックとして登録しているパッケージについて、OSV.dev(認証不要の公開脆弱性DB)から
 * 新規の脆弱性を検知し、即時アラートを送る。ダイジェストとは独立して実行する。
 */
export async function runCheckVulnerabilities(): Promise<CheckVulnerabilitiesSummary> {
  const db = createDb(env.DATABASE_URL);
  const summary: CheckVulnerabilitiesSummary = { packagesChecked: 0, newAlerts: 0, emailsSent: 0, errors: [] };
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "digest@tech-ai-news.example";
  const publishedSinceDate = new Date(Date.now() - LOOKBACK_DAYS * 24 * 3600 * 1000).toISOString();

  try {
    const mappings = await listTopicPackageMappings(db);

    for (const mapping of mappings) {
      summary.packagesChecked += 1;
      try {
        const matches = await queryOsvForPackage(mapping.ecosystem, mapping.packageName, publishedSinceDate);

        for (const match of matches) {
          const alert = await insertVulnerabilityAlertIfNew(db, {
            topicId: mapping.topicId,
            packageName: mapping.packageName,
            ecosystem: mapping.ecosystem,
            osvId: match.osvId,
            summary: match.summary,
            severity: match.severity,
            detailsUrl: match.detailsUrl,
          });
          if (!alert) continue; // 既知の脆弱性(既にDBにある)なので通知しない
          summary.newAlerts += 1;

          const users = await listTopicFollowersForTopic(db, mapping.topicId);
          for (const user of users) {
            const claimed = await claimVulnerabilityAlertDelivery(db, user.userId, alert.id);
            if (!claimed) continue;

            try {
              await getResend().emails.send({
                from: fromEmail,
                to: user.email,
                subject: `[tech/ai news] 脆弱性アラート: ${mapping.packageName}`,
                html: buildAlertHtml(mapping.packageName, match.summary, match.severity, match.detailsUrl),
              });
              summary.emailsSent += 1;

              if (user.slackEnabled && user.slackWebhookUrl) {
                try {
                  await sendSlackText(
                    user.slackWebhookUrl,
                    `${severityEmoji(match.severity)} *脆弱性アラート: ${mapping.packageName}*\n${match.summary}\n${match.detailsUrl}`,
                  );
                } catch (err) {
                  console.warn(`[checkVulnerabilities] slack send failed: ${(err as Error).message}`);
                }
              }
            } catch (err) {
              summary.errors.push({ context: `email:${user.userId}:${alert.osvId}`, message: (err as Error).message });
            }
          }
        }
      } catch (err) {
        summary.errors.push({ context: `${mapping.ecosystem}/${mapping.packageName}`, message: (err as Error).message });
      }
    }
  } finally {
    await db.end({ timeout: 5 });
  }

  return summary;
}
