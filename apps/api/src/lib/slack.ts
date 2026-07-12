interface SlackDigestArticle {
  slug: string;
  title: string;
  summary: string;
  sourceName: string;
  highlighted: boolean;
}

/**
 * Slack Incoming Webhookへダイジェストを送信する。ユーザーが自分でSlack側の
 * 「Incoming Webhooks」アプリから発行したURLを設定画面に貼る方式(OAuth不要)。
 * 失敗してもメール配信自体は継続させたいため、呼び出し側でtry/catchすること。
 */
export async function sendSlackDigest(
  webhookUrl: string,
  heading: string,
  articles: SlackDigestArticle[],
  siteUrl: string,
): Promise<void> {
  const blocks: unknown[] = [
    {
      type: "header",
      text: { type: "plain_text", text: heading, emoji: true },
    },
  ];

  for (const article of articles) {
    const prefix = article.highlighted ? ":rotating_light: *あなたのスタックに関係あり* — " : "";
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `${prefix}*<${siteUrl}/articles/${article.slug}|${article.title}>*\n${article.sourceName}\n${article.summary}`,
      },
    });
  }

  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text: heading, blocks }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`slack webhook responded with ${res.status}`);
  }
}

/** 単発のテキスト通知(CVE/脆弱性アラート等)を送る。 */
export async function sendSlackText(webhookUrl: string, text: string): Promise<void> {
  const res = await fetch(webhookUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    throw new Error(`slack webhook responded with ${res.status}`);
  }
}
