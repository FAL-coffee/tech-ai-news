import {
  createDb,
  getLastWeeklyDeliveryAt,
  getUserStackSlugs,
  getUserTopicSlugs,
  listArticlesForWeeklyDigest,
  listWeeklyDigestRecipients,
  recordWeeklyDelivery,
} from "@tech-ai-news/db";
import type { Article } from "@tech-ai-news/shared";
import { render } from "@react-email/render";
import { WeeklyDigestEmail } from "../emails/WeeklyDigestEmail";
import { env } from "../env";
import { sendSlackDigest } from "../lib/slack";
import { getResend } from "../lib/resend";

export interface WeeklyDigestSummary {
  recipientsChecked: number;
  emailsSent: number;
  skippedNoNewArticles: number;
  errors: { userId: string; message: string }[];
}

const DEFAULT_LOOKBACK_DAYS = 7;
const MAX_HIGHLIGHTS_PER_DIGEST = 8;

function formatJstDate(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" }).format(
    new Date(iso),
  );
}

/** 破壊的変更・非推奨化のうち、ユーザーが登録した技術スタックに一致するものだけを強調表示する。 */
function isStackHighlighted(article: Article, stackSlugs: string[]): boolean {
  if (!article.breakingChange && !article.deprecation) return false;
  if (stackSlugs.length === 0) return false;
  return (article.topics ?? []).some((slug) => stackSlugs.includes(slug));
}

/** 週次まとめ: 毎日は追えない層向けに、重要度が高い記事だけを抜粋して届ける(デイリー版とは独立した配信履歴を持つ)。 */
export async function runWeeklyDigest(): Promise<WeeklyDigestSummary> {
  const db = createDb(env.DATABASE_URL);
  const summary: WeeklyDigestSummary = { recipientsChecked: 0, emailsSent: 0, skippedNoNewArticles: 0, errors: [] };

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "digest@tech-ai-news.example";

  try {
    const recipients = await listWeeklyDigestRecipients(db);

    for (const recipient of recipients) {
      summary.recipientsChecked += 1;
      try {
        const [topicSlugs, stackSlugs, lastDeliveryAt] = await Promise.all([
          getUserTopicSlugs(db, recipient.userId),
          getUserStackSlugs(db, recipient.userId),
          getLastWeeklyDeliveryAt(db, recipient.userId),
        ]);
        const sinceDate =
          lastDeliveryAt ?? new Date(Date.now() - DEFAULT_LOOKBACK_DAYS * 24 * 3600 * 1000).toISOString();

        const articles = await listArticlesForWeeklyDigest(db, {
          sinceDate,
          topicSlugs,
          limit: MAX_HIGHLIGHTS_PER_DIGEST,
          minImportance: recipient.minImportance,
        });

        if (articles.length === 0) {
          summary.skippedNoNewArticles += 1;
          continue;
        }

        const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${recipient.unsubscribeToken}`;
        const digestArticles = articles.map((a) => ({
          slug: a.slug,
          title: a.title,
          summary: a.summary,
          sourceName: a.sourceName,
          publishedDate: formatJstDate(a.originalPublishedAt ?? a.publishedAt),
          highlighted: isStackHighlighted(a, stackSlugs),
        }));

        const html = await render(WeeklyDigestEmail({ articles: digestArticles, siteUrl, unsubscribeUrl }));

        const result = await getResend().emails.send({
          from: fromEmail,
          to: recipient.email,
          subject: `[tech/ai news] 今週のハイライト${articles.length}件`,
          html,
          headers: {
            "List-Unsubscribe": `<${siteUrl}/api/unsubscribe?token=${recipient.unsubscribeToken}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        await recordWeeklyDelivery(db, {
          userId: recipient.userId,
          articleIds: articles.map((a) => a.id),
          resendMessageId: result.data?.id ?? null,
        });
        summary.emailsSent += 1;

        if (recipient.slackEnabled && recipient.slackWebhookUrl) {
          try {
            await sendSlackDigest(
              recipient.slackWebhookUrl,
              `tech/ai news — 今週のハイライト${articles.length}件`,
              digestArticles,
              siteUrl,
            );
          } catch (err) {
            console.warn(`[weeklyDigest] slack send failed for user ${recipient.userId}: ${(err as Error).message}`);
          }
        }
      } catch (err) {
        summary.errors.push({ userId: recipient.userId, message: (err as Error).message });
      }
    }
  } finally {
    await db.end({ timeout: 5 });
  }

  return summary;
}
