import Link from "next/link";
import { ResetPasswordForm } from "../../components/ResetPasswordForm";

interface PageProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

export default async function ResetPasswordPage({ searchParams }: PageProps) {
  const { token, error } = await searchParams;

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1>パスワード再設定</h1>
        {token && !error ? (
          <>
            <p className="auth-subtitle">新しいパスワードを入力してください</p>
            <ResetPasswordForm token={token} />
          </>
        ) : (
          <p className="form-error">
            リンクが無効、または有効期限が切れています。お手数ですが再度リクエストしてください。
          </p>
        )}
        <p className="auth-footer">
          <Link href="/forgot-password">再設定リンクをもう一度送る</Link>
        </p>
      </div>
    </main>
  );
}
