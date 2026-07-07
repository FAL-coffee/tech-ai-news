import {
  getArticleBySlug,
  getLikeCount,
  getSubscriptionByUserId,
  isBookmarkedByUser,
  isLikedByUser,
} from "@tech-ai-news/db";
import { isActiveSubscription } from "@tech-ai-news/shared";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { ArticleReactions } from "../../../components/ArticleReactions";
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
      publishedTime: article.publishedAt,
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
  const [subscription, likeCount, liked, bookmarked] = await Promise.all([
    session ? getSubscriptionByUserId(db, session.user.id) : null,
    getLikeCount(db, article.id),
    session ? isLikedByUser(db, session.user.id, article.id) : false,
    session ? isBookmarkedByUser(db, session.user.id, article.id) : false,
  ]);
  const canReadFull = isActiveSubscription(subscription?.status);

  return (
    <main className="page">
      <article className="article-detail">
        <h1>{article.title}</h1>
        {article.ogImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={article.ogImageUrl} alt="" className="article-hero-image" />
        )}
        <p className="meta">
          <span>{article.sourceName}</span>
          <span aria-hidden="true">·</span>
          <span>重要度 {article.importance}</span>
          <span aria-hidden="true">·</span>
          <span>{new Date(article.publishedAt).toLocaleDateString("ja-JP")}</span>
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
      </article>
    </main>
  );
}
