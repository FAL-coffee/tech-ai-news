// tsxがtsconfig(jsx: react-jsx)を読み込めない環境(古いNode等)ではJSXがclassic変換に
// フォールバックするため、どちらの変換でも動くようReactを明示的にインポートしておく。
import * as React from "react";

export interface DigestArticle {
  slug: string;
  title: string;
  summary: string;
  sourceName: string;
  /** 表示用に整形済みの公開日(例: "7/9")。 */
  publishedDate: string;
}

export interface DigestEmailProps {
  articles: DigestArticle[];
  siteUrl: string;
  unsubscribeUrl: string;
}

const styles = {
  body: {
    margin: 0,
    padding: "32px 16px",
    backgroundColor: "#f7f5f0",
    fontFamily: "Georgia, 'Hiragino Mincho ProN', 'Yu Mincho', serif",
    color: "#1c1a17",
  },
  container: {
    maxWidth: "560px",
    margin: "0 auto",
    backgroundColor: "#fffdf9",
    border: "1px solid #ddd6c5",
    borderRadius: "10px",
    padding: "32px",
  },
  eyebrow: {
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: "12px",
    fontWeight: 700,
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "#a63e0f",
    margin: "0 0 8px",
  },
  heading: {
    fontSize: "22px",
    fontWeight: 700,
    margin: "0 0 24px",
  },
  articleBlock: {
    padding: "20px 0",
    borderTop: "1px solid #ddd6c5",
  },
  articleTitle: {
    fontSize: "17px",
    fontWeight: 700,
    margin: "0 0 6px",
  },
  articleTitleLink: {
    color: "#1c1a17",
    textDecoration: "none",
  },
  meta: {
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: "11px",
    letterSpacing: "0.03em",
    textTransform: "uppercase" as const,
    color: "#968f7d",
    margin: "0 0 10px",
  },
  summary: {
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: "14px",
    lineHeight: 1.6,
    color: "#6b6355",
    margin: "0 0 10px",
  },
  readMore: {
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: "13px",
    fontWeight: 700,
    color: "#a63e0f",
    textDecoration: "none",
  },
  footer: {
    fontFamily: "Helvetica, Arial, sans-serif",
    fontSize: "12px",
    lineHeight: 1.6,
    color: "#968f7d",
    marginTop: "32px",
    paddingTop: "20px",
    borderTop: "1px solid #ddd6c5",
  },
  footerLink: {
    color: "#968f7d",
    textDecoration: "underline",
  },
};

export function DigestEmail({ articles, siteUrl, unsubscribeUrl }: DigestEmailProps) {
  return (
    <html lang="ja">
      <body style={styles.body}>
        <div style={styles.container}>
          <p style={styles.eyebrow}>Primary Sources Only</p>
          <h1 style={styles.heading}>
            <a href={siteUrl} style={styles.articleTitleLink}>
              tech/ai news
            </a>{" "}
            — 新着記事{articles.length}件
          </h1>

          {articles.map((article) => (
            <div key={article.slug} style={styles.articleBlock}>
              <h2 style={styles.articleTitle}>
                <a href={`${siteUrl}/articles/${article.slug}`} style={styles.articleTitleLink}>
                  {article.title}
                </a>
              </h2>
              <p style={styles.meta}>
                {article.sourceName} · {article.publishedDate}
              </p>
              <p style={styles.summary}>{article.summary}</p>
              <a href={`${siteUrl}/articles/${article.slug}`} style={styles.readMore}>
                続きを読む →
              </a>
            </div>
          ))}

          <div style={styles.footer}>
            <p>
              このメールは tech/ai news のトピック購読設定に基づいて配信されています。
              <br />
              配信を停止する場合は
              <a href={unsubscribeUrl} style={styles.footerLink}>
                こちら
              </a>
              から解除できます。
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
