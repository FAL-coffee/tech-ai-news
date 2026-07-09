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

function formatJstDate(iso: string): string {
  return new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" }).format(
    new Date(iso),
  );
}

interface PlainTextArticle {
  slug: string;
  title: string;
  summary: string;
  sourceName: string;
  publishedDate: string;
}

function buildPlainText(articles: PlainTextArticle[], siteUrl: string, unsubscribeUrl: string): string {
  const items = articles
    .map((a) => `■ ${a.title}\n  ${a.sourceName} · ${a.publishedDate}\n  ${a.summary}\n  ${siteUrl}/articles/${a.slug}`)
    .join("\n\n");
  return [
    `tech/ai news — 新着記事${articles.length}件`,
    "",
    items,
    "",
    "---",
    "このメールは tech/ai news のトピック購読設定に基づいて配信されています。",
    `配信停止: ${unsubscribeUrl}`,
  ].join("\n");
}

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
        const oneClickUnsubscribeUrl = `${siteUrl}/api/unsubscribe?token=${recipient.unsubscribeToken}`;
        const digestArticles = articles.map((a) => ({
          slug: a.slug,
          title: a.title,
          summary: a.summary,
          sourceName: a.sourceName,
          publishedDate: formatJstDate(a.originalPublishedAt ?? a.publishedAt),
        }));
        const html = await render(
          DigestEmail({
            articles: digestArticles,
            siteUrl,
            unsubscribeUrl,
          }),
        );

        const result = await getResend().emails.send({
          from: fromEmail,
          to: recipient.email,
          subject: `[tech/ai news] ${formatJstDate(new Date().toISOString())}の新着記事${articles.length}件`,
          html,
          // HTMLを表示できない環境・迷惑メール判定対策のためプレーンテキスト版も同梱する。
          text: buildPlainText(digestArticles, siteUrl, unsubscribeUrl),
          headers: {
            // 特電法対応: List-Unsubscribeヘッダでメールクライアント標準の配信停止にも対応する。
            // RFC 8058: Gmail/Yahoo!の一括送信者要件であるワンクリック配信停止(POST)にも対応する。
            "List-Unsubscribe": `<${oneClickUnsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          },
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
