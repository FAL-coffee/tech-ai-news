import { getArticleBySlug } from "@tech-ai-news/db";
import { ImageResponse } from "next/og";
import { getDb } from "../../../lib/db";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * 記事シェア時のOGP画像。原文サイトのog:image(article.ogImageUrl)をそのまま使うと
 * シェア先で原文サイトのブランドが表示されてしまうため、tech/ai newsブランドの画像を
 * このファイル(Next.jsのopengraph-image規約)で独自生成し、シェア経由の流入を自社の認知に繋げる。
 */
export default async function ArticleOpengraphImage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const article = await getArticleBySlug(db, slug);
  const title = article?.title ?? "tech/ai news";
  const sourceName = article?.sourceName;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px 90px",
          background: "#f7f5f0",
          fontFamily: "Georgia, serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: "Helvetica, Arial, sans-serif",
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#a63e0f",
          }}
        >
          <div style={{ width: 36, height: 2, background: "#a63e0f" }} />
          PRIMARY SOURCES ONLY
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? 52 : 64,
            fontWeight: 700,
            color: "#1c1a17",
            lineHeight: 1.3,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div
            style={{
              display: "flex",
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: 24,
              color: "#6b6355",
            }}
          >
            {sourceName ? `原文: ${sourceName}` : ""}
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#1c1a17" }}>
            tech<span style={{ color: "#a63e0f" }}>/</span>ai
            <span style={{ color: "#968f7d", fontWeight: 500 }}>&nbsp;news</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
