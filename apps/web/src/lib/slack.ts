/** 単発のテキスト通知(設定画面からのテスト送信用)を送る。apps/api/src/lib/slack.tsと同じロジック。 */
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
