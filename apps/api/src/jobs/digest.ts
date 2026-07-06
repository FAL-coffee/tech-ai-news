import {
  createDb,
  getLastDeliveryAt,
  getUserTopicSlugs,
  listArticlesForDigest,
  listDigestRecipients,
  recordDelivery,
} from "@tech-ai-news/db";
import { render } from "@react-email/render";
import { DigestEmail } from "../emails/DigestEmail";
import { env } from "../env";
import { getResend } from "../lib/resend";

export interface DigestSummary {
  recipientsChecked: number;
  emailsSent: number;
  skippedNoNewArticles: number;
  errors: { userId: string; message: string }[];
}

// deliveries履歴が無い(初回配信の)ユーザーに対して、どこまで過去の記事を遡って含めるか。
const DEFAULT_LOOKBACK_HOURS = 48;
const MAX_ARTICLES_PER_DIGEST = 10;

export async function runDigest(): Promise<DigestSummary> {
  const db = createDb(env.DATABASE_URL);
  const summary: DigestSummary = { recipientsChecked: 0, emailsSent: 0, skippedNoNewArticles: 0, errors: [] };

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "digest@tech-ai-news.example";

  try {
    const recipients = await listDigestRecipients(db);

    for (const recipient of recipients) {
      summary.recipientsChecked += 1;
      try {
        const [topicSlugs, lastDeliveryAt] = await Promise.all([
          getUserTopicSlugs(db, recipient.userId),
          getLastDeliveryAt(db, recipient.userId),
        ]);
        const sinceDate = lastDeliveryAt ?? new Date(Date.now() - DEFAULT_LOOKBACK_HOURS * 3600 * 1000).toISOString();

        const articles = await listArticlesForDigest(db, {
          sinceDate,
          topicSlugs,
          limit: MAX_ARTICLES_PER_DIGEST,
        });

        if (articles.length === 0) {
          summary.skippedNoNewArticles += 1;
          continue;
        }

        const unsubscribeUrl = `${siteUrl}/unsubscribe?token=${recipient.unsubscribeToken}`;
        const html = await render(
          DigestEmail({
            articles: articles.map((a) => ({
              slug: a.slug,
              title: a.title,
              summary: a.summary,
              sourceName: a.sourceName,
            })),
            siteUrl,
            unsubscribeUrl,
          }),
        );

        const result = await getResend().emails.send({
          from: fromEmail,
          to: recipient.email,
          subject: `[tech/ai news] 新着記事${articles.length}件`,
          html,
          // 特電法対応: List-Unsubscribeヘッダでメールクライアント標準の配信停止にも対応する。
          headers: { "List-Unsubscribe": `<${unsubscribeUrl}>` },
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        await recordDelivery(db, {
          userId: recipient.userId,
          articleIds: articles.map((a) => a.id),
          resendMessageId: result.data?.id ?? null,
        });
        summary.emailsSent += 1;
      } catch (err) {
        summary.errors.push({ userId: recipient.userId, message: (err as Error).message });
      }
    }
  } finally {
    await db.end({ timeout: 5 });
  }

  return summary;
}
