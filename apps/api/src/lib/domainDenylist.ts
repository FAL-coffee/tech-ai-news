/**
 * Hacker News経由の収集先候補として提案しないドメインの一覧。
 *
 * ここでの目的は2つ:
 * (1) ノイズ削減 — YouTube/Twitter/個人ブログ等は候補として提案しても大半が却下されるだけ
 * (2) 方針の事故防止 — 報道機関・ニュースメディアは明示的に除外する。これらを収集先候補として
 *     admin画面に出すこと自体が「報道記事の要約配信」という最もリスクの高いパターン
 *     (docs/spec.md §9)へ誘導しかねないため、候補生成の時点でブロックする。
 *
 * 完全な一覧ではない。承認は必ず人間が行うため、ここは安全側マージンであって
 * 唯一の防御線ではない。
 */
export const DOMAIN_DENYLIST: ReadonlySet<string> = new Set([
  // 汎用ホスティング・SNS・コミュニティ
  "github.com",
  "raw.githubusercontent.com",
  "githubusercontent.com",
  "gist.github.com",
  "youtube.com",
  "twitter.com",
  "x.com",
  "reddit.com",
  "medium.com",
  "substack.com",
  "linkedin.com",
  "facebook.com",
  "instagram.com",
  "tiktok.com",
  "stackoverflow.com",
  "news.ycombinator.com",
  "wikipedia.org",
  "arxiv.org",
  "dev.to",
  "hashnode.dev",
  "blogspot.com",
  "wordpress.com",
  "tumblr.com",

  // 報道・ニュースメディア(一次情報限定の方針上、常に除外)
  "bloomberg.com",
  "wsj.com",
  "nytimes.com",
  "theverge.com",
  "techcrunch.com",
  "arstechnica.com",
  "wired.com",
  "forbes.com",
  "reuters.com",
  "cnbc.com",
  "businessinsider.com",
  "engadget.com",
  "tomshardware.com",
  "hackaday.com",
  "apnews.com",
  "bbc.com",
  "bbc.co.uk",
  "cnn.com",
  "theguardian.com",
  "washingtonpost.com",
]);
