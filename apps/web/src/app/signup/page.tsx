import Link from "next/link";
import { SignupForm } from "../../components/SignupForm";

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1>新規登録</h1>
        <p className="auth-subtitle">有料プランですべての記事を日英で読めます</p>
        <SignupForm next={next ?? "/pricing"} />
        <p className="auth-footer">
          すでにアカウントをお持ちの方は{" "}
          <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>ログイン</Link>
        </p>
      </div>
    </main>
  );
}
