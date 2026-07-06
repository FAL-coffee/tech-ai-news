/**
 * Hacker News経由の発見機能で「一次情報として扱ってよい」と判断する公式ドメインの一覧。
 * docs/spec.md §9 の法務ガードレール(情報源をベンダー公式に限定する)をコード上でも
 * 強制するためのものなので、追加する際は必ず公式ドメインであることを確認すること。
 *
 * github.com / raw.githubusercontent.com のような汎用ホスティングドメインは、
 * 無関係なコンテンツまで拾ってしまうため意図的に含めない(GitHub Releasesは
 * source.kind='github_releases' の専用収集で個別リポジトリ単位に限定している)。
 */
export const TRUSTED_HN_DOMAINS: ReadonlySet<string> = new Set([
  "vercel.com",
  "nextjs.org",
  "react.dev",
  "openai.com",
  "anthropic.com", // 公式RSSが無いため、HN経由の発見が特に有効なドメイン
  "github.blog",
  "aws.amazon.com",
  "blog.cloudflare.com",
  "deno.com",
  "bun.com",
  "bun.sh",
  "devblogs.microsoft.com",
  "typescriptlang.org",
]);
