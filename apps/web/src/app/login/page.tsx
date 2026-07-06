import Link from "next/link";
import { LoginForm } from "../../components/LoginForm";

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function LoginPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1>ログイン</h1>
        <p className="auth-subtitle">アカウントにログインして続きを読みましょう</p>
        <LoginForm next={next ?? "/account"} />
        <p className="auth-footer">
          <Link href="/forgot-password">パスワードをお忘れの方はこちら</Link>
        </p>
        <p className="auth-footer">
          アカウントをお持ちでない方は{" "}
          <Link href={`/signup${next ? `?next=${encodeURIComponent(next)}` : ""}`}>新規登録</Link>
        </p>
      </div>
    </main>
  );
}
