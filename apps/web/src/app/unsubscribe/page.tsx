import { setDigestEnabledByToken } from "@tech-ai-news/db";
import Link from "next/link";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  let success = false;
  if (token) {
    const db = getDb();
    success = await setDigestEnabledByToken(db, token, false);
  }

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1>配信停止</h1>
        {success ? (
          <p className="auth-subtitle">メールダイジェストの配信を停止しました。設定はいつでもアカウント画面から再開できます。</p>
        ) : (
          <p className="auth-subtitle">
            リンクが無効か、有効期限が切れています。お手数ですが<Link href="/account">アカウント画面</Link>から設定を変更してください。
          </p>
        )}
      </div>
    </main>
  );
}
