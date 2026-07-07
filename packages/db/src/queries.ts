import type postgres from "postgres";
import type {
  Article,
  CandidateStatus,
  EmailPreference,
  RawItem,
  RawItemStatus,
  Source,
  SourceCandidate,
  Subscription,
  SubscriptionStatus,
  Topic,
  TopicCandidate,
} from "@tech-ai-news/shared";
import type { Db } from "./index";

/** db.begin()内で渡されるトランザクションオブジェクトの型(Dbとタグ付きテンプレートの呼び出し方は同じ)。 */
type Tx = postgres.TransactionSql<{}>;

function mapSource(row: any): Source {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind,
    url: row.url,
    etag: row.etag,
    lastModified: row.last_modified,
    fetchIntervalMin: row.fetch_interval_min,
    lastFetchedAt: row.last_fetched_at,
    enabled: row.enabled,
    createdAt: row.created_at,
  };
}

function mapRawItem(row: any): RawItem {
  return {
    id: row.id,
    sourceId: row.source_id,
    externalUrl: row.external_url,
    title: row.title,
    contentText: row.content_text,
    contentHash: row.content_hash,
    publishedAt: row.published_at,
    fetchedAt: row.fetched_at,
    status: row.status,
    importance: row.importance,
    topics: row.topics,
    lastError: row.last_error,
  };
}

function mapArticle(row: any): Article {
  return {
    id: row.id,
    rawItemId: row.raw_item_id,
    slug: row.slug,
    title: row.title,
    summary: row.summary,
    body: row.body,
    highlight: row.highlight,
    ogImageUrl: row.og_image_url,
    originalUrl: row.original_url,
    sourceName: row.source_name,
    importance: row.importance,
    model: row.model,
    publishedAt: row.published_at,
    originalPublishedAt: row.original_published_at,
    status: row.status,
    topics: row.topic_slugs ?? undefined,
  };
}

/** pgvector のテキスト形式(`[0.1,0.2,...]`)へ変換。JSON配列表記と一致するため追加ライブラリ不要。 */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

/** 最後に取得した時刻が古いソースから順に返す(nullは未取得として最優先)。1回の実行で
 * 全ソースを処理しきれない場合(呼び出し側でlimitを適用する場合)でも、公平に巡回できるようにする。 */
export async function listEnabledSources(db: Db): Promise<Source[]> {
  const rows = await db`select * from sources where enabled = true order by last_fetched_at asc nulls first, name asc`;
  return rows.map(mapSource);
}

export async function listAllSourceNames(db: Db): Promise<string[]> {
  const rows = await db<{ name: string }[]>`select name from sources`;
  return rows.map((r) => r.name);
}

function slugifyTopicName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\.js$/, "js")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * ソース名(例: "Vercel Blog", "AWS News Blog", "elastic.co")から技術名らしい表記を取り出す。
 * 末尾の括弧書き(Bluesky等)・種別語(Blog/News/Releases/Changelog)を除去し、
 * ドメイン名そのものがソース名の場合(候補承認経由)は先頭を大文字にする。
 */
function deriveTopicNameFromSourceName(sourceName: string): string {
  let name = sourceName.replace(/\s*\([^)]*\)\s*$/g, "").trim();
  const suffixPattern = /\s+(Blog|News|Releases|Changelog)$/i;
  while (suffixPattern.test(name)) {
    name = name.replace(suffixPattern, "").trim();
  }
  // ".js"で終わる製品名(Next.js, Node.js, Three.js等)はドメインとして誤検出しないよう除外する。
  if (!/\.js$/i.test(name)) {
    const domainMatch = name.match(/^([a-z0-9-]+)\.[a-z]{2,}$/i);
    if (domainMatch) {
      name = domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
    }
  }
  return name || sourceName;
}

/**
 * sourcesに新規追加された技術に対応するトピックが無ければ自動作成する。
 * 今後追加される言語・フレームワーク・ライブラリも自動でタグ化できるようにするため、
 * insertSource/approveSourceCandidateの両方から呼ぶ。既に同じslugがあれば何もしない。
 */
export async function ensureTopicForSource(db: Db | Tx, sourceName: string): Promise<void> {
  const name = deriveTopicNameFromSourceName(sourceName);
  const slug = slugifyTopicName(name);
  if (!slug) return;
  await db`
    insert into topics (slug, name_ja, name_en)
    values (${slug}, ${name}, ${name})
    on conflict (slug) do nothing
  `;
}

export interface InsertSourceInput {
  name: string;
  kind: Source["kind"];
  url: string;
}

/** 収集先候補(source_candidates)を介さず、検証済みのソースを直接登録する(discoverTrendsジョブ用)。 */
export async function insertSource(db: Db, input: InsertSourceInput): Promise<{ inserted: boolean }> {
  const rows = await db`
    insert into sources (name, kind, url)
    values (${input.name}, ${input.kind}, ${input.url})
    on conflict (url) do nothing
    returning id
  `;
  const inserted = rows.length > 0;
  if (inserted) await ensureTopicForSource(db, input.name);
  return { inserted };
}

export async function updateSourceFetchMeta(
  db: Db,
  id: string,
  meta: { etag?: string | null; lastModified?: string | null },
): Promise<void> {
  await db`
    update sources
    set etag = ${meta.etag ?? null},
        last_modified = ${meta.lastModified ?? null},
        last_fetched_at = now()
    where id = ${id}
  `;
}

/** dedupe は unique(source_id, external_url) と unique(content_hash) の両方に依存。挿入できたら true。 */
export async function insertRawItem(
  db: Db,
  item: {
    sourceId: string;
    externalUrl: string;
    title: string;
    contentText: string | null;
    contentHash: string;
    publishedAt: string | null;
  },
): Promise<boolean> {
  const rows = await db`
    insert into raw_items (source_id, external_url, title, content_text, content_hash, published_at, status)
    values (${item.sourceId}, ${item.externalUrl}, ${item.title}, ${item.contentText}, ${item.contentHash}, ${item.publishedAt}, 'new')
    on conflict do nothing
    returning id
  `;
  return rows.length > 0;
}

export async function listTopicSlugs(db: Db): Promise<string[]> {
  const rows = await db<{ slug: string }[]>`select slug from topics order by slug`;
  return rows.map((r) => r.slug);
}

export async function listRawItemsByStatus(
  db: Db,
  status: RawItemStatus,
  limit: number,
): Promise<RawItem[]> {
  const rows = await db`
    select * from raw_items
    where status = ${status}
    order by published_at desc nulls last
    limit ${limit}
  `;
  return rows.map(mapRawItem);
}

export interface RawItemWithSource extends RawItem {
  sourceName: string;
}

export async function listRawItemsByStatusWithSource(
  db: Db,
  status: RawItemStatus,
  limit: number,
): Promise<RawItemWithSource[]> {
  const rows = await db`
    select r.*, s.name as source_name
    from raw_items r
    join sources s on s.id = r.source_id
    where r.status = ${status}
    order by r.published_at desc nulls last
    limit ${limit}
  `;
  return rows.map((row: any) => ({ ...mapRawItem(row), sourceName: row.source_name }));
}

export async function updateRawItemClassification(
  db: Db,
  id: string,
  result: { importance: number; topics: string[]; status: RawItemStatus },
): Promise<void> {
  await db`
    update raw_items
    set importance = ${result.importance},
        topics = ${result.topics},
        status = ${result.status},
        last_error = null
    where id = ${id}
  `;
}

export async function markRawItemGenerated(db: Db, id: string): Promise<void> {
  await db`update raw_items set status = 'generated', last_error = null where id = ${id}`;
}

export async function recordRawItemError(db: Db, id: string, message: string): Promise<void> {
  await db`update raw_items set last_error = ${message} where id = ${id}`;
}

export interface SelectedItemWithSource extends RawItem {
  sourceName: string;
}

export async function listSelectedRawItems(db: Db, limit: number): Promise<SelectedItemWithSource[]> {
  const rows = await db`
    select r.*, s.name as source_name
    from raw_items r
    join sources s on s.id = r.source_id
    where r.status = 'selected'
    order by r.importance desc nulls last
    limit ${limit}
  `;
  return rows.map((row: any) => ({ ...mapRawItem(row), sourceName: row.source_name }));
}

export interface NewArticleInput {
  rawItemId: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  highlight: string;
  ogImageUrl: string | null;
  originalUrl: string;
  sourceName: string;
  importance: number;
  model: string;
  embedding: number[];
  topicSlugs: string[];
  originalPublishedAt?: string | null;
}

/** 記事挿入 + article_topics 紐付け + raw_items.status='generated' を1トランザクションで実行。 */
export async function insertArticleWithTopics(db: Db, input: NewArticleInput): Promise<string> {
  return db.begin(async (tx) => {
    const [article] = await tx`
      insert into articles (
        raw_item_id, slug, title, summary, body, highlight, og_image_url,
        original_url, source_name, importance, model, embedding, original_published_at
      ) values (
        ${input.rawItemId}, ${input.slug}, ${input.title}, ${input.summary}, ${input.body},
        ${input.highlight}, ${input.ogImageUrl},
        ${input.originalUrl}, ${input.sourceName}, ${input.importance}, ${input.model},
        ${toVectorLiteral(input.embedding)}::vector, ${input.originalPublishedAt ?? null}
      )
      returning id
    `;

    for (const slug of input.topicSlugs) {
      await tx`
        insert into article_topics (article_id, topic_id, score)
        select ${article.id}, t.id, 1.0 from topics t where t.slug = ${slug}
        on conflict do nothing
      `;
    }

    await tx`update raw_items set status = 'generated', last_error = null where id = ${input.rawItemId}`;

    return article.id as string;
  });
}

export interface ListArticlesOptions {
  topic?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listPublishedArticles(db: Db, opts: ListArticlesOptions = {}): Promise<Article[]> {
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const search = opts.search?.trim() ?? "";
  const searchPattern = `%${search}%`;

  const rows = opts.topic
    ? await db`
        select a.*, array_agg(t.slug) as topic_slugs
        from articles a
        join article_topics at2 on at2.article_id = a.id
        join topics t on t.id = at2.topic_id
        where a.status = 'published'
          and (${search} = '' or a.title ilike ${searchPattern} or a.summary ilike ${searchPattern} or a.body ilike ${searchPattern})
          and a.id in (
            select at3.article_id from article_topics at3
            join topics t2 on t2.id = at3.topic_id
            where t2.slug = ${opts.topic}
          )
        group by a.id
        order by a.published_at desc
        limit ${limit} offset ${offset}
      `
    : await db`
        select a.*, array_agg(t.slug) as topic_slugs
        from articles a
        left join article_topics at2 on at2.article_id = a.id
        left join topics t on t.id = at2.topic_id
        where a.status = 'published'
          and (${search} = '' or a.title ilike ${searchPattern} or a.summary ilike ${searchPattern} or a.body ilike ${searchPattern})
        group by a.id
        order by a.published_at desc
        limit ${limit} offset ${offset}
      `;
  return rows.map(mapArticle);
}

export interface CountArticlesOptions {
  topic?: string;
  search?: string;
}

export async function countPublishedArticles(db: Db, opts: CountArticlesOptions = {}): Promise<number> {
  const search = opts.search?.trim() ?? "";
  const searchPattern = `%${search}%`;

  const rows = opts.topic
    ? await db<{ count: number }[]>`
        select count(distinct a.id)::int as count
        from articles a
        where a.status = 'published'
          and (${search} = '' or a.title ilike ${searchPattern} or a.summary ilike ${searchPattern} or a.body ilike ${searchPattern})
          and a.id in (
            select at3.article_id from article_topics at3
            join topics t2 on t2.id = at3.topic_id
            where t2.slug = ${opts.topic}
          )
      `
    : await db<{ count: number }[]>`
        select count(*)::int as count
        from articles a
        where a.status = 'published'
          and (${search} = '' or a.title ilike ${searchPattern} or a.summary ilike ${searchPattern} or a.body ilike ${searchPattern})
      `;
  return rows[0]?.count ?? 0;
}

export interface RecommendedArticlesOptions {
  topicSlugs: string[];
  excludeIds?: string[];
  limit?: number;
}

/**
 * トップページの「おすすめ」用。興味トピックがあればそれに合う記事を新着順、無ければ重要度順の
 * 記事(ログインしていない/トピック未選択のユーザー向けの既定表示)を返す。
 */
export async function listRecommendedArticles(db: Db, opts: RecommendedArticlesOptions): Promise<Article[]> {
  const limit = opts.limit ?? 6;
  const excludeIds = opts.excludeIds ?? [];

  const rows =
    opts.topicSlugs.length > 0
      ? await db`
          select a.*, array_agg(t.slug) as topic_slugs
          from articles a
          join article_topics at2 on at2.article_id = a.id
          join topics t on t.id = at2.topic_id
          where a.status = 'published'
            and not (a.id = any(${excludeIds}))
            and a.id in (
              select at3.article_id from article_topics at3
              join topics t2 on t2.id = at3.topic_id
              where t2.slug = any(${opts.topicSlugs})
            )
          group by a.id
          order by a.published_at desc
          limit ${limit}
        `
      : await db`
          select a.*, array_agg(t.slug) as topic_slugs
          from articles a
          left join article_topics at2 on at2.article_id = a.id
          left join topics t on t.id = at2.topic_id
          where a.status = 'published'
            and not (a.id = any(${excludeIds}))
          group by a.id
          order by a.importance desc, a.published_at desc
          limit ${limit}
        `;
  return rows.map(mapArticle);
}

export interface DigestArticlesOptions {
  sinceDate: string;
  topicSlugs: string[];
  limit?: number;
}

/** メールダイジェスト用: 指定日時以降に公開された記事を、トピック指定があればそれに絞って返す。 */
export async function listArticlesForDigest(db: Db, opts: DigestArticlesOptions): Promise<Article[]> {
  const limit = opts.limit ?? 10;
  const rows =
    opts.topicSlugs.length > 0
      ? await db`
          select a.*, array_agg(t.slug) as topic_slugs
          from articles a
          join article_topics at2 on at2.article_id = a.id
          join topics t on t.id = at2.topic_id
          where a.status = 'published'
            and a.published_at > ${opts.sinceDate}
            and a.id in (
              select at3.article_id from article_topics at3
              join topics t2 on t2.id = at3.topic_id
              where t2.slug = any(${opts.topicSlugs})
            )
          group by a.id
          order by a.published_at desc
          limit ${limit}
        `
      : await db`
          select a.*, array_agg(t.slug) as topic_slugs
          from articles a
          left join article_topics at2 on at2.article_id = a.id
          left join topics t on t.id = at2.topic_id
          where a.status = 'published'
            and a.published_at > ${opts.sinceDate}
          group by a.id
          order by a.published_at desc
          limit ${limit}
        `;
  return rows.map(mapArticle);
}

export async function getArticleBySlug(db: Db, slug: string): Promise<Article | null> {
  const rows = await db`
    select a.*, array_agg(t.slug) as topic_slugs
    from articles a
    left join article_topics at2 on at2.article_id = a.id
    left join topics t on t.id = at2.topic_id
    where a.slug = ${slug}
    group by a.id
  `;
  return rows.length > 0 ? mapArticle(rows[0]) : null;
}

export async function listTopics(db: Db): Promise<Topic[]> {
  const rows = await db`select * from topics order by slug`;
  return rows.map((row: any) => ({
    id: row.id,
    slug: row.slug,
    nameJa: row.name_ja,
    nameEn: row.name_en,
  }));
}

export interface TopicWithArticleCount extends Topic {
  articleCount: number;
}

/** トピック一覧ページ用: 公開済み記事の件数付き(件数が多い順)。記事が0件のトピックも含む。 */
export async function listTopicsWithArticleCount(db: Db): Promise<TopicWithArticleCount[]> {
  const rows = await db`
    select t.*, count(a.id) as article_count
    from topics t
    left join article_topics at2 on at2.topic_id = t.id
    left join articles a on a.id = at2.article_id and a.status = 'published'
    group by t.id
    order by article_count desc, t.slug
  `;
  return rows.map((row: any) => ({
    id: row.id,
    slug: row.slug,
    nameJa: row.name_ja,
    nameEn: row.name_en,
    articleCount: Number(row.article_count),
  }));
}

function mapSubscription(row: any): Subscription {
  return {
    userId: row.user_id,
    stripeCustomerId: row.stripe_customer_id,
    stripeSubscriptionId: row.stripe_subscription_id,
    status: row.status,
    plan: row.plan,
    currentPeriodEnd: row.current_period_end,
  };
}

export async function getSubscriptionByUserId(db: Db, userId: string): Promise<Subscription | null> {
  const rows = await db`select * from subscriptions where user_id = ${userId}`;
  return rows.length > 0 ? mapSubscription(rows[0]) : null;
}

export interface UpsertSubscriptionInput {
  userId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  plan?: string;
  currentPeriodEnd: string | null;
}

/** Stripeのwebhookから呼ぶ。user_idで一意なのでON CONFLICTで洗い替えする。 */
export async function upsertSubscription(db: Db, input: UpsertSubscriptionInput): Promise<void> {
  await db`
    insert into subscriptions (user_id, stripe_customer_id, stripe_subscription_id, status, plan, current_period_end, updated_at)
    values (
      ${input.userId}, ${input.stripeCustomerId}, ${input.stripeSubscriptionId},
      ${input.status}, ${input.plan ?? "monthly"}, ${input.currentPeriodEnd}, now()
    )
    on conflict (user_id) do update set
      stripe_customer_id = excluded.stripe_customer_id,
      stripe_subscription_id = excluded.stripe_subscription_id,
      status = excluded.status,
      plan = excluded.plan,
      current_period_end = excluded.current_period_end,
      updated_at = now()
  `;
}

export async function getUserTopicSlugs(db: Db, userId: string): Promise<string[]> {
  const rows = await db<{ slug: string }[]>`
    select t.slug from user_topics ut
    join topics t on t.id = ut.topic_id
    where ut.user_id = ${userId}
    order by t.slug
  `;
  return rows.map((r) => r.slug);
}

/** 選択トピックを丸ごと洗い替える(削除→再挿入)。 */
export async function setUserTopics(db: Db, userId: string, topicSlugs: string[]): Promise<void> {
  await db.begin(async (tx) => {
    await tx`delete from user_topics where user_id = ${userId}`;
    for (const slug of topicSlugs) {
      await tx`
        insert into user_topics (user_id, topic_id)
        select ${userId}, t.id from topics t where t.slug = ${slug}
        on conflict do nothing
      `;
    }
  });
}

/** 他の選択トピックには触れず、1件だけ追加/解除する(記事ページのタグクリックからの追加用)。 */
export async function toggleUserTopic(db: Db, userId: string, topicSlug: string): Promise<{ followed: boolean }> {
  const [existing] = await db`
    select 1 from user_topics ut join topics t on t.id = ut.topic_id
    where ut.user_id = ${userId} and t.slug = ${topicSlug}
  `;

  if (existing) {
    await db`
      delete from user_topics
      where user_id = ${userId} and topic_id = (select id from topics where slug = ${topicSlug})
    `;
    return { followed: false };
  }

  await db`
    insert into user_topics (user_id, topic_id)
    select ${userId}, t.id from topics t where t.slug = ${topicSlug}
    on conflict do nothing
  `;
  return { followed: true };
}

// ---------------------------------------------------------------------------
// 収集先候補・タグ候補(半自動発見+承認フロー)
// ---------------------------------------------------------------------------

export async function listTrustedDomains(db: Db): Promise<string[]> {
  const rows = await db<{ domain: string }[]>`select domain from trusted_domains`;
  return rows.map((r) => r.domain);
}

export async function addTrustedDomain(db: Db, domain: string, note?: string): Promise<void> {
  await db`
    insert into trusted_domains (domain, note)
    values (${domain}, ${note ?? null})
    on conflict (domain) do nothing
  `;
}

/**
 * 既にsource_candidatesに存在する(pending/approved/rejectedいずれか)ドメインの一覧。
 * HN scan時にフィード自動検出を再実行すべきでない(=既知の)ドメインを判定するために使う。
 */
export async function listKnownCandidateDomains(db: Db): Promise<Set<string>> {
  const rows = await db<{ domain: string }[]>`select domain from source_candidates`;
  return new Set(rows.map((r) => r.domain));
}

function mapSourceCandidate(row: any): SourceCandidate {
  return {
    id: row.id,
    domain: row.domain,
    discoveryCount: row.discovery_count,
    sampleUrls: row.sample_urls ?? [],
    detectedFeedUrl: row.detected_feed_url,
    detectedFeedKind: row.detected_feed_kind,
    trustScore: row.trust_score,
    status: row.status,
    resultingSourceId: row.resulting_source_id,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

export interface UpsertSourceCandidateInput {
  domain: string;
  sampleUrl: string;
  detectedFeedUrl?: string | null;
  detectedFeedKind?: "rss" | "atom" | null;
}

/**
 * 既にpending以外(approved/rejected)の候補は更新しない(再提案で復活させない)。
 * sample_urlsは直近5件までに絞る。信頼度スコアはdiscovery_countの増分後の値で算出する必要があるため
 * (呼び出し側がスコアを計算できるように)更新後の行を返す。pending以外でブロックされた場合はnullを返す。
 */
export async function upsertSourceCandidate(
  db: Db,
  input: UpsertSourceCandidateInput,
): Promise<{ id: string; domain: string; discoveryCount: number; detectedFeedUrl: string | null } | null> {
  const [row] = await db`
    insert into source_candidates (domain, discovery_count, sample_urls, detected_feed_url, detected_feed_kind)
    values (${input.domain}, 1, array[${input.sampleUrl}]::text[], ${input.detectedFeedUrl ?? null}, ${input.detectedFeedKind ?? null})
    on conflict (domain) do update set
      discovery_count = source_candidates.discovery_count + 1,
      sample_urls = (
        select array_agg(t.url) from (
          select u.url from unnest(array_append(source_candidates.sample_urls, ${input.sampleUrl}))
            with ordinality as u(url, ord)
          order by u.ord desc
          limit 5
        ) t
      ),
      detected_feed_url = coalesce(source_candidates.detected_feed_url, ${input.detectedFeedUrl ?? null}),
      detected_feed_kind = coalesce(source_candidates.detected_feed_kind, ${input.detectedFeedKind ?? null}),
      updated_at = now()
    where source_candidates.status = 'pending'
    returning id, domain, discovery_count, detected_feed_url
  `;
  if (!row) return null;
  return {
    id: row.id,
    domain: row.domain,
    discoveryCount: row.discovery_count,
    detectedFeedUrl: row.detected_feed_url,
  };
}

export async function setSourceCandidateTrustScore(db: Db, id: string, trustScore: number): Promise<void> {
  await db`update source_candidates set trust_score = ${trustScore} where id = ${id}`;
}

export async function listSourceCandidates(db: Db, status: CandidateStatus): Promise<SourceCandidate[]> {
  const rows = await db`
    select * from source_candidates where status = ${status} order by trust_score desc, discovery_count desc, created_at desc
  `;
  return rows.map(mapSourceCandidate);
}

/** 信頼度スコアによる自動承認(reviewed_by is null)の履歴。admin画面での透明性表示用。 */
export async function listAutoApprovedSourceCandidates(db: Db, limit: number): Promise<SourceCandidate[]> {
  const rows = await db`
    select * from source_candidates
    where status = 'approved' and reviewed_by is null
    order by reviewed_at desc
    limit ${limit}
  `;
  return rows.map(mapSourceCandidate);
}

/**
 * 承認: trusted_domainsへ追加し、フィード自動検出できていればsourcesにも登録する。
 * すでにpending以外(approved/rejected)の候補は無視する(承認→却下のような操作の重複で
 * trusted_domains/sourcesへの副作用だけが残ってしまう事故を防ぐため)。
 * reviewedByがnullの場合は信頼度スコアに基づく自動承認(人間のレビューを介さない)を表す。
 */
export async function approveSourceCandidate(
  db: Db,
  id: string,
  reviewedBy: string | null,
): Promise<{ sourceId: string | null }> {
  return db.begin(async (tx) => {
    const [candidate] = await tx`select * from source_candidates where id = ${id} and status = 'pending'`;
    if (!candidate) {
      return { sourceId: null };
    }

    const note = reviewedBy
      ? "Hacker News経由の発見から承認"
      : "信頼度スコアによる自動承認(大手企業の公式ドメイン一致+フィード検出済み)";
    await tx`
      insert into trusted_domains (domain, note)
      values (${candidate.domain}, ${note})
      on conflict (domain) do nothing
    `;

    let sourceId: string | null = null;
    if (candidate.detected_feed_url) {
      const [source] = await tx`
        insert into sources (name, kind, url)
        values (${candidate.domain}, ${candidate.detected_feed_kind ?? "rss"}, ${candidate.detected_feed_url})
        on conflict (url) do update set enabled = true
        returning id
      `;
      sourceId = source.id;
      await ensureTopicForSource(tx, candidate.domain);
    }

    await tx`
      update source_candidates
      set status = 'approved', resulting_source_id = ${sourceId}, reviewed_by = ${reviewedBy}, reviewed_at = now(), updated_at = now()
      where id = ${id}
    `;

    return { sourceId };
  });
}

/** すでにpending以外の候補への却下は無視する(承認済みをうっかり却下してもtrusted_domains/sourcesはそのまま残ってしまうため、statusだけ変えるのは危険)。 */
export async function rejectSourceCandidate(db: Db, id: string, reviewedBy: string): Promise<void> {
  await db`
    update source_candidates
    set status = 'rejected', reviewed_by = ${reviewedBy}, reviewed_at = now(), updated_at = now()
    where id = ${id} and status = 'pending'
  `;
}

function mapTopicCandidate(row: any): TopicCandidate {
  return {
    id: row.id,
    slug: row.slug,
    nameJa: row.name_ja,
    nameEn: row.name_en,
    reason: row.reason,
    occurrenceCount: row.occurrence_count,
    status: row.status,
    resultingTopicId: row.resulting_topic_id,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
  };
}

export interface UpsertTopicCandidateInput {
  slug: string;
  nameJa: string;
  nameEn: string;
  reason?: string | null;
}

export async function upsertTopicCandidate(db: Db, input: UpsertTopicCandidateInput): Promise<void> {
  await db`
    insert into topic_candidates (slug, name_ja, name_en, reason)
    values (${input.slug}, ${input.nameJa}, ${input.nameEn}, ${input.reason ?? null})
    on conflict (slug) do update set
      occurrence_count = topic_candidates.occurrence_count + 1,
      updated_at = now()
    where topic_candidates.status = 'pending'
  `;
}

export async function listTopicCandidates(db: Db, status: CandidateStatus): Promise<TopicCandidate[]> {
  const rows = await db`
    select * from topic_candidates where status = ${status} order by occurrence_count desc, created_at desc
  `;
  return rows.map(mapTopicCandidate);
}

/** すでにpending以外の候補への承認は無視する(idと同じ理由の安全策)。 */
export async function approveTopicCandidate(
  db: Db,
  id: string,
  reviewedBy: string,
): Promise<{ topicId: string | null }> {
  return db.begin(async (tx) => {
    const [candidate] = await tx`select * from topic_candidates where id = ${id} and status = 'pending'`;
    if (!candidate) {
      return { topicId: null };
    }

    const [topic] = await tx`
      insert into topics (slug, name_ja, name_en)
      values (${candidate.slug}, ${candidate.name_ja}, ${candidate.name_en})
      on conflict (slug) do update set name_ja = excluded.name_ja
      returning id
    `;

    await tx`
      update topic_candidates
      set status = 'approved', resulting_topic_id = ${topic.id}, reviewed_by = ${reviewedBy}, reviewed_at = now(), updated_at = now()
      where id = ${id}
    `;

    return { topicId: topic.id };
  });
}

export async function rejectTopicCandidate(db: Db, id: string, reviewedBy: string): Promise<void> {
  await db`
    update topic_candidates
    set status = 'rejected', reviewed_by = ${reviewedBy}, reviewed_at = now(), updated_at = now()
    where id = ${id} and status = 'pending'
  `;
}

// ---------------------------------------------------------------------------
// メールダイジェスト配信
// ---------------------------------------------------------------------------

function mapEmailPreference(row: any): EmailPreference {
  return {
    userId: row.user_id,
    digestEnabled: row.digest_enabled,
    consentAt: row.consent_at,
    unsubscribeToken: row.unsubscribe_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function getEmailPreferenceByUserId(db: Db, userId: string): Promise<EmailPreference | null> {
  const rows = await db`select * from email_preferences where user_id = ${userId}`;
  return rows.length > 0 ? mapEmailPreference(rows[0]) : null;
}

export interface UpsertEmailPreferenceInput {
  userId: string;
  digestEnabled: boolean;
  unsubscribeToken: string;
}

/**
 * digest_enabled=trueへの変更時のみ同意日時(consent_at)を記録する(特電法対応の同意証跡)。
 * すでにconsent_atがある場合は上書きしない(最初の同意日時を保持する)。
 */
export async function upsertEmailPreference(db: Db, input: UpsertEmailPreferenceInput): Promise<void> {
  const consentAt = input.digestEnabled ? new Date().toISOString() : null;
  await db`
    insert into email_preferences (user_id, digest_enabled, consent_at, unsubscribe_token)
    values (${input.userId}, ${input.digestEnabled}, ${consentAt}, ${input.unsubscribeToken})
    on conflict (user_id) do update set
      digest_enabled = excluded.digest_enabled,
      consent_at = coalesce(email_preferences.consent_at, excluded.consent_at),
      updated_at = now()
  `;
}

/** ログイン不要のワンクリック配信停止リンク用。トークンが見つからなければfalse。 */
export async function setDigestEnabledByToken(db: Db, token: string, enabled: boolean): Promise<boolean> {
  const rows = await db`
    update email_preferences set digest_enabled = ${enabled}, updated_at = now()
    where unsubscribe_token = ${token}
    returning user_id
  `;
  return rows.length > 0;
}

export interface DigestRecipient {
  userId: string;
  email: string;
  unsubscribeToken: string;
}

/** 配信停止リストに載っていない、ダイジェスト受信を有効にしているユーザー一覧。 */
export async function listDigestRecipients(db: Db): Promise<DigestRecipient[]> {
  const rows = await db`
    select u.id as user_id, u.email, ep.unsubscribe_token
    from email_preferences ep
    join "user" u on u.id = ep.user_id
    where ep.digest_enabled = true
      and not exists (select 1 from suppressions s where s.email = u.email)
  `;
  return rows.map((row: any) => ({
    userId: row.user_id,
    email: row.email,
    unsubscribeToken: row.unsubscribe_token,
  }));
}

/** そのユーザーへの直近の配信日時。一度も送っていなければnull。 */
export async function getLastDeliveryAt(db: Db, userId: string): Promise<string | null> {
  const rows = await db`select max(sent_at) as last_sent_at from deliveries where user_id = ${userId}`;
  return rows[0]?.last_sent_at ?? null;
}

export interface RecordDeliveryInput {
  userId: string;
  articleIds: string[];
  resendMessageId: string | null;
}

export async function recordDelivery(db: Db, input: RecordDeliveryInput): Promise<void> {
  await db`
    insert into deliveries (user_id, article_ids, resend_message_id)
    values (${input.userId}, ${input.articleIds}::uuid[], ${input.resendMessageId})
  `;
}

export async function addSuppression(db: Db, email: string, reason: string): Promise<void> {
  await db`
    insert into suppressions (email, reason) values (${email}, ${reason})
    on conflict (email) do nothing
  `;
}

export async function isSuppressed(db: Db, email: string): Promise<boolean> {
  const rows = await db`select 1 from suppressions where email = ${email}`;
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// 紹介プログラム
// ---------------------------------------------------------------------------

/** 被紹介者は1回しか紹介元を持てない(既に記録済みなら無視)。 */
export async function recordReferral(db: Db, refereeUserId: string, referrerUserId: string): Promise<void> {
  await db`
    insert into referrals (referee_user_id, referrer_user_id)
    values (${refereeUserId}, ${referrerUserId})
    on conflict (referee_user_id) do nothing
  `;
}

export async function getReferrerUserId(db: Db, refereeUserId: string): Promise<string | null> {
  const rows = await db`select referrer_user_id from referrals where referee_user_id = ${refereeUserId}`;
  return rows[0]?.referrer_user_id ?? null;
}

export async function countReferralsByReferrer(db: Db, referrerUserId: string): Promise<number> {
  const rows = await db`select count(*)::int as count from referrals where referrer_user_id = ${referrerUserId}`;
  return rows[0]?.count ?? 0;
}

// ---------------------------------------------------------------------------
// 記事へのいいね・ブックマーク
// ---------------------------------------------------------------------------

/** トグル動作: 既に押していれば取り消し、押していなければ登録する。 */
export async function toggleLike(db: Db, userId: string, articleId: string): Promise<{ liked: boolean }> {
  const [existing] = await db`select 1 from article_likes where user_id = ${userId} and article_id = ${articleId}`;
  if (existing) {
    await db`delete from article_likes where user_id = ${userId} and article_id = ${articleId}`;
    return { liked: false };
  }
  await db`insert into article_likes (user_id, article_id) values (${userId}, ${articleId}) on conflict do nothing`;
  return { liked: true };
}

export async function toggleBookmark(db: Db, userId: string, articleId: string): Promise<{ bookmarked: boolean }> {
  const [existing] = await db`
    select 1 from article_bookmarks where user_id = ${userId} and article_id = ${articleId}
  `;
  if (existing) {
    await db`delete from article_bookmarks where user_id = ${userId} and article_id = ${articleId}`;
    return { bookmarked: false };
  }
  await db`insert into article_bookmarks (user_id, article_id) values (${userId}, ${articleId}) on conflict do nothing`;
  return { bookmarked: true };
}

export async function getLikeCount(db: Db, articleId: string): Promise<number> {
  const [row] = await db`select count(*)::int as count from article_likes where article_id = ${articleId}`;
  return row?.count ?? 0;
}

export async function isLikedByUser(db: Db, userId: string, articleId: string): Promise<boolean> {
  const rows = await db`select 1 from article_likes where user_id = ${userId} and article_id = ${articleId}`;
  return rows.length > 0;
}

export async function isBookmarkedByUser(db: Db, userId: string, articleId: string): Promise<boolean> {
  const rows = await db`
    select 1 from article_bookmarks where user_id = ${userId} and article_id = ${articleId}
  `;
  return rows.length > 0;
}

export async function listBookmarkedArticles(db: Db, userId: string): Promise<Article[]> {
  const rows = await db`
    select a.*, array_agg(t.slug) as topic_slugs
    from article_bookmarks b
    join articles a on a.id = b.article_id
    left join article_topics at2 on at2.article_id = a.id
    left join topics t on t.id = at2.topic_id
    where b.user_id = ${userId}
    group by a.id, b.created_at
    order by b.created_at desc
  `;
  return rows.map(mapArticle);
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  createdAt: string;
  subscriptionStatus: SubscriptionStatus | null;
  subscriptionPlan: string | null;
}

function mapAdminUserListItem(row: any): AdminUserListItem {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerified,
    createdAt: row.createdAt,
    subscriptionStatus: row.subscription_status,
    subscriptionPlan: row.subscription_plan,
  };
}

export interface ListUsersForAdminOptions {
  search?: string;
  limit?: number;
  offset?: number;
}

export async function listUsersForAdmin(db: Db, opts: ListUsersForAdminOptions = {}): Promise<AdminUserListItem[]> {
  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const search = opts.search?.trim();
  const rows = search
    ? await db`
        select u."id", u."name", u."email", u."emailVerified", u."createdAt",
               s.status as subscription_status, s.plan as subscription_plan
        from "user" u
        left join subscriptions s on s.user_id = u."id"
        where u."email" ilike ${`%${search}%`} or u."name" ilike ${`%${search}%`}
        order by u."createdAt" desc
        limit ${limit} offset ${offset}
      `
    : await db`
        select u."id", u."name", u."email", u."emailVerified", u."createdAt",
               s.status as subscription_status, s.plan as subscription_plan
        from "user" u
        left join subscriptions s on s.user_id = u."id"
        order by u."createdAt" desc
        limit ${limit} offset ${offset}
      `;
  return rows.map(mapAdminUserListItem);
}

export async function countUsersForAdmin(db: Db, search?: string): Promise<number> {
  const trimmed = search?.trim();
  const rows = trimmed
    ? await db<{ count: number }[]>`
        select count(*)::int as count from "user"
        where "email" ilike ${`%${trimmed}%`} or "name" ilike ${`%${trimmed}%`}
      `
    : await db<{ count: number }[]>`select count(*)::int as count from "user"`;
  return rows[0]?.count ?? 0;
}
