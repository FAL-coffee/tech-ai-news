import Link from "next/link";
import { SignupForm } from "../../components/SignupForm";

interface PageProps {
  searchParams: Promise<{ next?: string }>;
}

export default async function SignupPage({ searchParams }: PageProps) {
  const { next } = await searchParams;

  return (
    <main>
      <h1>新規登録</h1>
      <SignupForm next={next ?? "/pricing"} />
      <p>
        すでにアカウントをお持ちの方は <Link href={`/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}>ログイン</Link>
      </p>
    </main>
  );
}
