"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "../lib/auth-client";

export function SignupForm({ next, referrerUserId }: { next: string; referrerUserId?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [digestConsent, setDigestConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: signUpError } = await authClient.signUp.email({ name, email, password });
    if (signUpError) {
      setLoading(false);
      setError(signUpError.message ?? "登録に失敗しました");
      return;
    }

    // メール配信の同意状態・紹介元の記録は、失敗してもサインアップ自体は成功として続行する。
    try {
      await fetch("/api/email-preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ digestEnabled: digestConsent }),
      });
    } catch {
      // no-op: アカウント画面から後で設定できる
    }

    if (referrerUserId) {
      try {
        await fetch("/api/referrals", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ referrerUserId }),
        });
      } catch {
        // no-op: 紹介トライアル延長のみを失う。サインアップ自体は継続する
      }
    }

    setLoading(false);
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        お名前
        <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <label>
        メールアドレス
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      <label>
        パスワード(8文字以上)
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>
      <label className="consent-checkbox">
        <input type="checkbox" checked={digestConsent} onChange={(e) => setDigestConsent(e.target.checked)} />
        <span>新着記事のメールダイジェストを受け取る(いつでも配信停止できます)</span>
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? "登録中..." : "登録する"}
      </button>
    </form>
  );
}
