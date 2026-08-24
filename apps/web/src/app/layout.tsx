import { headers } from "next/headers";
import type { Metadata } from "next";
import { M_PLUS_1, M_PLUS_1_Code } from "next/font/google";
import Link from "next/link";
import type { ReactNode } from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import { isAdminEmail } from "../lib/admin";
import { auth } from "../lib/auth";
import { appUrl } from "../lib/site";
import "./globals.css";

const THEME_INIT_SCRIPT = `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`;

const mplus1 = M_PLUS_1({
  subsets: ["latin"],
  weight: ["500", "700", "900"],
  variable: "--font-mplus1",
  display: "swap",
});
const mplus1Code = M_PLUS_1_Code({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-mplus1-code",
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
    <html lang="ja" className={`${mplus1.variable} ${mplus1Code.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <div className="signal-ticker" aria-hidden="true">
          SOURCE FEED — 公式ブログ・リリースノート・公式アカウントのみを収集、二次情報は扱いません
        </div>
        <header className="site-header">
          <div className="site-header-inner">
            <Link href="/" className="brand">
              tech<span className="brand-accent">/</span>ai<span className="brand-suffix"> news</span>
              <span className="brand-live">
                <span className="brand-live-dot" />
                更新中
              </span>
            </Link>
            <nav className="main-nav">
              <Link href="/archive" className="nav-link">
                アーカイブ
              </Link>
              {hasSession && (
                <Link href="/dashboard" className="nav-link">
                  ダッシュボード
                </Link>
              )}
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
              <ThemeToggle />
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
