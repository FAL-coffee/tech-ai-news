import {
  getArticleBySlug,
  getLikeCount,
  getSubscriptionByUserId,
  getUserTopicSlugs,
  isBookmarkedByUser,
  isLikedByUser,
  listTopics,
} from "@tech-ai-news/db";
import { isActiveSubscription } from "@tech-ai-news/shared";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArticleImage } from "../../../components/ArticleImage";
import { ArticleReactions } from "../../../components/ArticleReactions";
import { ArticleTopicTags } from "../../../components/ArticleTopicTags";
import { ShareLinks } from "../../../components/ShareLinks";
import { auth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";
import { appUrl } from "../../../lib/site";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const article = await getArticleBySlug(db, slug);
  if (!article || article.status !== "published") return {};

  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      publishedTime: article.originalPublishedAt ?? article.publishedAt,
      modifiedTime: article.updatedAt,
      images: article.ogImageUrl ? [article.ogImageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  const db = getDb();
  const article = await getArticleBySlug(db, slug);
  // 未公開(draft)・取り下げ済み(retracted)の記事は直接URLでも閲覧不可にする。
  if (!article || article.status !== "published") notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const [subscription, likeCount, liked, bookmarked, allTopics, followedTopicSlugs] = await Promise.all([
    session ? getSubscriptionByUserId(db, session.user.id) : null,
    getLikeCount(db, article.id),
    session ? isLikedByUser(db, session.user.id, article.id) : false,
    session ? isBookmarkedByUser(db, session.user.id, article.id) : false,
    listTopics(db),
    session ? getUserTopicSlugs(db, session.user.id) : [],
  ]);
  const canReadFull = isActiveSubscription(subscription?.status);
  const topicNameBySlug = new Map(allTopics.map((t) => [t.slug, t.nameJa]));
  const articleTopics = (article.topics ?? []).map((slug) => ({ slug, nameJa: topicNameBySlug.get(slug) ?? slug }));
  // 生成時はpublished_atとupdated_atが同時刻。再生成・修正された記事にのみ更新日時を出す。
  const wasUpdated = new Date(article.updatedAt).getTime() - new Date(article.publishedAt).getTime() > 60 * 1000;

  return (
    <main className="page">
      <article className="article-detail">
        <h1>{article.title}</h1>
        {article.ogImageUrl ? (
          <ArticleImage src={article.ogImageUrl} className="article-hero-image" lazy={false} />
        ) : (
          <div className="article-hero-image no-image-placeholder">
            <span>tech/ai news</span>
          </div>
        )}
        <p className="meta">
          <span>{article.sourceName}</span>
          <span aria-hidden="true">·</span>
          <span>重要度 {article.importance}</span>
          <span aria-hidden="true">·</span>
          <span>
            {article.originalPublishedAt ? "原文公開: " : ""}
            {new Date(article.originalPublishedAt ?? article.publishedAt).toLocaleDateString("ja-JP")}
          </span>
          {wasUpdated && (
            <>
              <span aria-hidden="true">·</span>
              <span>
                更新:{" "}
                {new Date(article.updatedAt).toLocaleString("ja-JP", {
                  timeZone: "Asia/Tokyo",
                  year: "numeric",
                  month: "numeric",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </>
          )}
        </p>

        {article.highlight && (
          <div className="highlight-callout">
            <span className="highlight-label">ワンポイント</span>
            <span>{article.highlight}</span>
          </div>
        )}

        {/* 法務ガードレール: 原文リンクと出典を必ず目立つ位置に表示する(docs/spec.md §4, §9) */}
        <p className="source-callout">
          この記事は <strong>{article.sourceName}</strong> の一次情報をもとにAIが再構成したものです。{" "}
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer">
            原文を読む →
          </a>
        </p>

        <ArticleReactions
          slug={article.slug}
          isLoggedIn={session !== null}
          initialLiked={liked}
          initialLikeCount={likeCount}
          initialBookmarked={bookmarked}
        />

        <ShareLinks url={`${appUrl()}/articles/${article.slug}`} title={article.title} />

        {canReadFull ? (
          <div className="article-body">
            <ReactMarkdown>{article.body}</ReactMarkdown>
          </div>
        ) : (
          <div className="paywall">
            <p>{article.summary}</p>
            <div className="paywall-cta">
              <p>全文を読むには有料プランへの登録が必要です。</p>
              <Link href="/pricing" className="paywall-button">
                プランを見る →
              </Link>
            </div>
          </div>
        )}

        {articleTopics.length > 0 && (
          <ArticleTopicTags
            articleSlug={article.slug}
            topics={articleTopics}
            isLoggedIn={session !== null}
            initialFollowedSlugs={followedTopicSlugs}
          />
        )}
      </article>
    </main>
  );
}
