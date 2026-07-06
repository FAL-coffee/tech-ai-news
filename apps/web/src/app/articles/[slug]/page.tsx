import { getArticleBySlug, getSubscriptionByUserId } from "@tech-ai-news/db";
import { isActiveSubscription } from "@tech-ai-news/shared";
import type { Metadata } from "next";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
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
  if (!article) return {};

  return {
    title: article.title,
    description: article.summary,
    alternates: { canonical: `/articles/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.summary,
      publishedTime: article.publishedAt,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;

  const db = getDb();
  const article = await getArticleBySlug(db, slug);
  if (!article) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const subscription = session ? await getSubscriptionByUserId(db, session.user.id) : null;
  const canReadFull = isActiveSubscription(subscription?.status);

  return (
    <main className="page">
      <article className="article-detail">
        <h1>{article.title}</h1>
        <p className="meta">
          <span>{article.sourceName}</span>
          <span aria-hidden="true">·</span>
          <span>重要度 {article.importance}</span>
          <span aria-hidden="true">·</span>
          <span>{new Date(article.publishedAt).toLocaleDateString("ja-JP")}</span>
        </p>

        {/* 法務ガードレール: 原文リンクと出典を必ず目立つ位置に表示する(docs/spec.md §4, §9) */}
        <p className="source-callout">
          この記事は <strong>{article.sourceName}</strong> の一次情報をもとにAIが再構成したものです。{" "}
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer">
            原文を読む →
          </a>
        </p>

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
