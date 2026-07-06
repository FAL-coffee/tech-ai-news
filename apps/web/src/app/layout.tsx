import { headers } from "next/headers";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { isAdminEmail } from "../lib/admin";
import { auth } from "../lib/auth";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: "tech-ai-news",
  description: "テック/AI一次情報のAI記事化サービス(開発中)",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // レイアウトは全ページ共通のため、認証まわりの設定不備でサイト全体が落ちないよう防御的にcatchする。
  let hasSession = false;
  let isAdmin = false;
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    hasSession = session !== null;
    isAdmin = isAdminEmail(session?.user.email);
  } catch {
    hasSession = false;
  }

  return (
    <html lang="ja" className={inter.variable}>
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              <span className="brand-mark" aria-hidden="true">
                AI
              </span>
              tech-ai-news
            </Link>
            <nav className="main-nav">
              <Link href="/pricing" className="nav-link">
                料金
              </Link>
              {isAdmin && (
                <Link href="/admin" className="nav-link">
                  Admin
                </Link>
              )}
              {hasSession ? (
                <Link href="/account" className="nav-link">
                  アカウント
                </Link>
              ) : (
                <>
                  <Link href="/login" className="nav-link">
                    ログイン
                  </Link>
                  <Link href="/signup" className="nav-link nav-link-cta">
                    新規登録
                  </Link>
                </>
              )}
            </nav>
          </div>
        </header>
        {children}
        <footer className="site-footer">
          <div className="site-footer-inner">
            <span>© {new Date().getFullYear()} tech-ai-news</span>
            <div className="footer-links">
              <Link href="/pricing">料金</Link>
              <a href="mailto:hello@tech-ai-news.example">お問い合わせ</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
