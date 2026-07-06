import Link from "next/link";
import { SignupForm } from "../../components/SignupForm";

interface PageProps {
  searchParams: Promise<{ next?: string; ref?: string }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const { next, ref } = await searchParams;

  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1>新規登録</h1>
        <p className="auth-subtitle">
          {ref ? "友達からの紹介で、無料トライアルが通常より長くなります。" : "有料プランですべての記事を日英で読めます"}
        </p>
        <SignupForm next={next ?? "/pricing"} referrerUserId={ref} />
        <p className="auth-footer">
          すでにアカウントをお持ちの方は{" "}
          <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>ログイン</Link>
        </p>
      </div>
    </main>
  );
}
