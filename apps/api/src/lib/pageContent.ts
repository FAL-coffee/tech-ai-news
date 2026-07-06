const USER_AGENT = "tech-ai-news-bot/0.1 (+https://github.com/FAL-coffee/tech-ai-news)";

/**
 * 任意のWebページからおおまかな本文を抽出する簡易実装。
 * 完全なReadability実装ではないが、script/style/nav/header/footer/asideといった
 * 主要なサイト装飾タグを除去したうえでタグを剥がすことで、RSSの<content:encoded>に
 * 近い粒度のテキストを得る。HN経由で発見した信頼済みドメインの記事の本文取得に使う
 * (HN自体はタイトルと投票数しか持たないため、そのままではLLM生成の材料として薄すぎる)。
 *
 * 既知の制約: robots.txtは現時点でチェックしていない(既存のRSS収集も同様)。
 */
export async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": USER_AGENT }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) {
    throw new Error(`page fetch failed: ${res.status} ${res.statusText}`);
  }
  const html = await res.text();
  return extractMainText(html);
}

export function extractMainText(html: string): string {
  let text = html;
  text = text.replace(/<(script|style|nav|header|footer|aside|noscript)[^>]*>[\s\S]*?<\/\1>/gi, " ");
  text = text.replace(/<!--[\s\S]*?-->/g, " ");
  text = text.replace(/<[^>]+>/g, " ");
  text = text
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;|&#39;|&apos;/gi, "'")
    .replace(/&#x2019;|&#8217;/gi, "’")
    .replace(/&#x2013;|&#8211;/gi, "–")
    .replace(/&#x2014;|&#8212;/gi, "—")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&"); // 名前付き実体はデコード順で&amp;を最後にする(&amp;lt;の二重デコード防止)
  return text.replace(/\s+/g, " ").trim();
}
