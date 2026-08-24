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
          background: "#0e1210",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 20,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#5ecbd0",
          }}
        >
          [ PRIMARY SOURCES ONLY ]
        </div>

        <div
          style={{
            display: "flex",
            fontSize: title.length > 40 ? 52 : 64,
            fontWeight: 700,
            color: "#eef1ea",
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
              fontSize: 24,
              color: "#93a08f",
            }}
          >
            {sourceName ? `原文: ${sourceName}` : ""}
          </div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 700, color: "#eef1ea" }}>
            tech<span style={{ color: "#ff8a3d" }}>/</span>ai
            <span style={{ color: "#5e6b5a", fontWeight: 500 }}>&nbsp;news</span>
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
