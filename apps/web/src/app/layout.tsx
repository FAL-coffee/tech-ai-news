import { headers } from "next/headers";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { auth } from "../lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "tech-ai-news",
  description: "テック/AI一次情報のAI記事化サービス(開発中)",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // レイアウトは全ページ共通のため、認証まわりの設定不備でサイト全体が落ちないよう防御的にcatchする。
  let hasSession = false;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    hasSession = session !== null;
  } catch {
    hasSession = false;
  }

  return (
    <html lang="ja">
      <body>
        <div className="site-nav">
          <Link href="/" className="site-nav-brand">
            tech-ai-news
          </Link>
          <nav>
            <Link href="/pricing">料金</Link>
            {hasSession ? (
              <Link href="/account">アカウント</Link>
            ) : (
              <>
                <Link href="/login">ログイン</Link>
                <Link href="/signup">新規登録</Link>
              </>
            )}
          </nav>
        </div>
        {children}
      </body>
    </html>
  );
}
