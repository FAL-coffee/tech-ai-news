import type { Db } from "./index";
import type {
  Article,
  CandidateStatus,
  RawItem,
  RawItemStatus,
  Source,
  SourceCandidate,
  Subscription,
  SubscriptionStatus,
  Topic,
  TopicCandidate,
} from "@tech-ai-news/shared";

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
    originalUrl: row.original_url,
    sourceName: row.source_name,
    importance: row.importance,
    model: row.model,
    publishedAt: row.published_at,
    status: row.status,
    topics: row.topic_slugs ?? undefined,
  };
}

/** pgvector のテキスト形式(`[0.1,0.2,...]`)へ変換。JSON配列表記と一致するため追加ライブラリ不要。 */
export function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

export async function listEnabledSources(db: Db): Promise<Source[]> {
  const rows = await db`select * from sources where enabled = true order by name`;
  return rows.map(mapSource);
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
  originalUrl: string;
  sourceName: string;
  importance: number;
  model: string;
  embedding: number[];
  topicSlugs: string[];
}

/** 記事挿入 + article_topics 紐付け + raw_items.status='generated' を1トランザクションで実行。 */
export async function insertArticleWithTopics(db: Db, input: NewArticleInput): Promise<string> {
  return db.begin(async (tx) => {
    const [article] = await tx`
      insert into articles (
        raw_item_id, slug, title, summary, body, original_url, source_name, importance, model, embedding
      ) values (
        ${input.rawItemId}, ${input.slug}, ${input.title}, ${input.summary}, ${input.body},
        ${input.originalUrl}, ${input.sourceName}, ${input.importance}, ${input.model},
        ${toVectorLiteral(input.embedding)}::vector
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
  limit?: number;
}

export async function listPublishedArticles(db: Db, opts: ListArticlesOptions = {}): Promise<Article[]> {
  const limit = opts.limit ?? 50;
  const rows = opts.topic
    ? await db`
        select a.*, array_agg(t.slug) as topic_slugs
        from articles a
        join article_topics at2 on at2.article_id = a.id
        join topics t on t.id = at2.topic_id
        where a.status = 'published'
          and a.id in (
            select at3.article_id from article_topics at3
            join topics t2 on t2.id = at3.topic_id
            where t2.slug = ${opts.topic}
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
  stripeCustomerId: string;
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
 * sample_urlsは直近5件までに絞る。
 */
export async function upsertSourceCandidate(db: Db, input: UpsertSourceCandidateInput): Promise<void> {
  await db`
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
  `;
}

export async function listSourceCandidates(db: Db, status: CandidateStatus): Promise<SourceCandidate[]> {
  const rows = await db`
    select * from source_candidates where status = ${status} order by discovery_count desc, created_at desc
  `;
  return rows.map(mapSourceCandidate);
}

/** 承認: trusted_domainsへ追加し、フィード自動検出できていればsourcesにも登録する。 */
export async function approveSourceCandidate(
  db: Db,
  id: string,
  reviewedBy: string,
): Promise<{ sourceId: string | null }> {
  return db.begin(async (tx) => {
    const [candidate] = await tx`select * from source_candidates where id = ${id}`;
    if (!candidate) {
      throw new Error(`source candidate not found: ${id}`);
    }

    await tx`
      insert into trusted_domains (domain, note)
      values (${candidate.domain}, 'Hacker News経由の発見から承認')
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
    }

    await tx`
      update source_candidates
      set status = 'approved', resulting_source_id = ${sourceId}, reviewed_by = ${reviewedBy}, reviewed_at = now(), updated_at = now()
      where id = ${id}
    `;

    return { sourceId };
  });
}

export async function rejectSourceCandidate(db: Db, id: string, reviewedBy: string): Promise<void> {
  await db`
    update source_candidates
    set status = 'rejected', reviewed_by = ${reviewedBy}, reviewed_at = now(), updated_at = now()
    where id = ${id}
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

export async function approveTopicCandidate(
  db: Db,
  id: string,
  reviewedBy: string,
): Promise<{ topicId: string }> {
  return db.begin(async (tx) => {
    const [candidate] = await tx`select * from topic_candidates where id = ${id}`;
    if (!candidate) {
      throw new Error(`topic candidate not found: ${id}`);
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
    where id = ${id}
  `;
}
