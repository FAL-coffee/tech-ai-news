import { getArticleBySlug, getSubscriptionByUserId } from "@tech-ai-news/db";
import { isActiveSubscription, type Lang } from "@tech-ai-news/shared";
import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { LangToggle } from "../../../components/LangToggle";
import { auth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export default async function ArticlePage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const sp = await searchParams;
  const lang: Lang = sp.lang === "en" ? "en" : "ja";

  const db = getDb();
  const article = await getArticleBySlug(db, slug);
  if (!article) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const subscription = session ? await getSubscriptionByUserId(db, session.user.id) : null;
  const canReadFull = isActiveSubscription(subscription?.status);

  const title = lang === "ja" ? article.titleJa : article.titleEn;
  const summary = lang === "ja" ? article.summaryJa : article.summaryEn;
  const body = lang === "ja" ? article.bodyJa : article.bodyEn;

  return (
    <main>
      <LangToggle lang={lang} />
      <article className="article-detail">
        <h1>{title}</h1>
        <p className="meta">
          {article.sourceName} · {lang === "ja" ? "重要度" : "importance"} {article.importance} ·{" "}
          {new Date(article.publishedAt).toLocaleDateString(lang === "ja" ? "ja-JP" : "en-US")}
        </p>

        {/* 法務ガードレール: 原文リンクと出典を必ず目立つ位置に表示する(docs/spec.md §4, §9) */}
        <p className="source-callout">
          {lang === "ja" ? "この記事は " : "This article is based on "}
          <strong>{article.sourceName}</strong>
          {lang === "ja" ? " の一次情報をもとにAIが再構成したものです。" : ", written by AI from primary-source material."}
          {" "}
          <a href={article.originalUrl} target="_blank" rel="noopener noreferrer">
            {lang === "ja" ? "原文を読む →" : "Read the original →"}
          </a>
        </p>

        {canReadFull ? (
          <div className="article-body">
            <ReactMarkdown>{body}</ReactMarkdown>
          </div>
        ) : (
          <div className="paywall">
            <p>{summary}</p>
            <div className="paywall-cta">
              <p>
                {lang === "ja"
                  ? "全文を読むには有料プランへの登録が必要です。"
                  : "Subscribe to read the full article."}
              </p>
              <Link href="/pricing" className="paywall-button">
                {lang === "ja" ? "プランを見る" : "See pricing"}
              </Link>
            </div>
          </div>
        )}
      </article>
    </main>
  );
}
