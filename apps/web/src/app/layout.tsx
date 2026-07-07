import { headers } from "next/headers";
import type { Metadata } from "next";
import { Inter, Source_Serif_4 } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { isAdminEmail } from "../lib/admin";
import { auth } from "../lib/auth";
import { appUrl } from "../lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-source-serif",
  display: "swap",
});

const SITE_DESCRIPTION = "公式ブログ・公式アカウントなどの一次情報を、AIが日本語記事として再構成してお届けするテック/AIニュースサービス。";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl()),
  title: { default: "tech/ai news", template: "%s | tech/ai news" },
  description: SITE_DESCRIPTION,
  openGraph: {
    siteName: "tech/ai news",
    type: "website",
    locale: "ja_JP",
  },
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
    <html lang="ja" className={`${inter.variable} ${sourceSerif.variable}`}>
      <body>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              tech<span className="brand-accent">/</span>ai<span className="brand-suffix"> news</span>
            </Link>
            <nav className="main-nav">
              <Link href="/topics" className="nav-link">
                トピック
              </Link>
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
            <span>© {new Date().getFullYear()} tech/ai news</span>
            <div className="footer-links">
              <Link href="/about">サービス概要</Link>
              <Link href="/pricing">料金</Link>
              <Link href="/terms">利用規約</Link>
              <Link href="/privacy">プライバシーポリシー</Link>
              <Link href="/tokushoho">特定商取引法に基づく表記</Link>
              <a href="mailto:fal.engineer.2001@gmail.com">お問い合わせ</a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
