import type { Db } from "./index";
import type { Article, RawItem, RawItemStatus, Source, Subscription, SubscriptionStatus, Topic } from "@tech-ai-news/shared";

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
    titleJa: row.title_ja,
    titleEn: row.title_en,
    summaryJa: row.summary_ja,
    summaryEn: row.summary_en,
    bodyJa: row.body_ja,
    bodyEn: row.body_en,
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
  titleJa: string;
  titleEn: string;
  summaryJa: string;
  summaryEn: string;
  bodyJa: string;
  bodyEn: string;
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
        raw_item_id, slug, title_ja, title_en, summary_ja, summary_en,
        body_ja, body_en, original_url, source_name, importance, model, embedding
      ) values (
        ${input.rawItemId}, ${input.slug}, ${input.titleJa}, ${input.titleEn},
        ${input.summaryJa}, ${input.summaryEn}, ${input.bodyJa}, ${input.bodyEn},
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
