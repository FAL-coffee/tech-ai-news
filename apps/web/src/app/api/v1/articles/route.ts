import { getSubscriptionByUserId, getUserIdByApiKeyHash, getUserTopicSlugs, listPublishedArticles } from "@tech-ai-news/db";
import { isActiveSubscription } from "@tech-ai-news/shared";
import { NextResponse } from "next/server";
import { hashApiKey } from "../../../../lib/apiKeys";
import { getDb } from "../../../../lib/db";

const MAX_LIMIT = 50;

/**
 * 社内ツール連携向けのJSON API。Authorization: Bearer <APIキー> で認証する。
 * デフォルトでは呼び出し元ユーザーが購読しているトピックに絞って返す(?topic=で上書き可能)。
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice("Bearer ".length).trim() : null;
  if (!token) {
    return NextResponse.json({ error: "missing bearer token" }, { status: 401 });
  }

  const db = getDb();
  const userId = await getUserIdByApiKeyHash(db, hashApiKey(token));
  if (!userId) {
    return NextResponse.json({ error: "invalid api key" }, { status: 401 });
  }

  const subscription = await getSubscriptionByUserId(db, userId);
  if (!isActiveSubscription(subscription?.status)) {
    return NextResponse.json({ error: "active subscription required" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic") ?? undefined;
  const since = searchParams.get("since") ?? undefined;
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(searchParams.get("limit")) || 20));

  const topicFilter = topic ? [topic] : await getUserTopicSlugs(db, userId);

  // 追うトピックが1つも無い場合、topic指定なしのlistPublishedArticlesは全件返してしまうため、
  // 明示的に「該当なし」として空配列を返す。
  if (topicFilter.length === 0) {
    return NextResponse.json({ articles: [] });
  }

  const articlesPerTopic = await Promise.all(
    topicFilter.map((slug) => listPublishedArticles(db, { topic: slug, dateFrom: since, limit })),
  );
  const merged = new Map(articlesPerTopic.flat().map((a) => [a.id, a]));
  const articles = Array.from(merged.values())
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    .slice(0, limit)
    .map((a) => ({
      title: a.title,
      summary: a.summary,
      url: `${new URL(request.url).origin}/articles/${a.slug}`,
      sourceName: a.sourceName,
      sourceUrl: a.originalUrl,
      importance: a.importance,
      breakingChange: a.breakingChange,
      deprecation: a.deprecation,
      topics: a.topics ?? [],
      publishedAt: a.publishedAt,
    }));

  return NextResponse.json({ articles });
}
