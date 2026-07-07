/**
 * 「明らかに信頼できる大手企業の公式ドメイン」の一覧。収集先候補の信頼度スコア算出、および
 * 自動承認の判定にのみ使う(収集先候補は依然としてこの一覧との一致がなければ自動承認されない)。
 *
 * ここに載っているのはapex domain(またはその主要なサブドメインパターン)のみ。判定は
 * 「ドメインがこの一覧のいずれかと完全一致、またはそのサブドメインである」で行う
 * (例: "blog.google" は "google" のサブドメインとして一致、"cloud.google.com" は "google.com" のサブドメインとして一致)。
 *
 * 完全な一覧ではない。あくまで「人間の承認を待たずに追加してよいと確信できる」大手テック企業の
 * 公式ドメインに限定しており、ここに無いドメインは通常どおり収集先候補として承認待ちになる。
 */
export const MAJOR_COMPANY_DOMAINS: ReadonlySet<string> = new Set([
  // 既にtrusted_domainsにあるものと重複してもよい(HN候補生成の時点でtrusted_domainsは
  // 除外済みのため、ここに載っていても実際にcandidateになるのは未登録ドメインだけ)。
  "google.com",
  "google",
  "microsoft.com",
  "amazon.com",
  "aws.amazon.com",
  "apple.com",
  "meta.com",
  "fb.com",
  "nvidia.com",
  "netflix.com",
  "spotify.com",
  "salesforce.com",
  "ibm.com",
  "oracle.com",
  "intel.com",
  "amd.com",
  "samsung.com",
  "sony.com",
  "adobe.com",
  "atlassian.com",
  "gitlab.com",
  "docker.com",
  "elastic.co",
  "mongodb.com",
  "redis.io",
  "jetbrains.com",
  "mozilla.org",
  "rust-lang.org",
  "python.org",
  "kubernetes.io",
  "cncf.io",
  "hashicorp.com",
  "datadoghq.com",
  "snowflake.com",
  "shopify.com",
  "stripe.com",
  "uber.com",
  "airbnb.com",
  "digitalocean.com",
  "heroku.com",
  "fastly.com",
  "twilio.com",
  "figma.com",
  "notion.so",
  "slack.com",
  "zoom.us",
  "dropbox.com",
  "box.com",
  "asana.com",
  "postman.com",
  "unity.com",
  "epicgames.com",
  "huggingface.co",
  "cohere.com",
  "mistral.ai",
  "perplexity.ai",
  "replicate.com",
  "netlify.com",
  "supabase.com",
  "planetscale.com",
  "neon.tech",
  "railway.app",
  "render.com",
  "grafana.com",
  "sentry.io",
  "newrelic.com",
  "pagerduty.com",
  "algolia.com",
  "vmware.com",
  "redhat.com",
  "canonical.com",
  "linuxfoundation.org",
  "apache.org",
  "nodejs.org",
  "npmjs.com",
  "postgresql.org",
  "mysql.com",
  "w3.org",
  "ecma-international.org",
]);

/** ドメインが大手企業の公式ドメイン(またはそのサブドメイン)と一致するかどうか。 */
export function isMajorCompanyDomain(domain: string): boolean {
  const normalized = domain.toLowerCase();
  if (MAJOR_COMPANY_DOMAINS.has(normalized)) return true;
  return [...MAJOR_COMPANY_DOMAINS].some((apex) => normalized.endsWith(`.${apex}`));
}
