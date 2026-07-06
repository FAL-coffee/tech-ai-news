"use client";

import { type FormEvent, useState } from "react";
import { authClient } from "../lib/auth-client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: requestError } = await authClient.requestPasswordReset({
      email,
      redirectTo: "/reset-password",
    });
    setLoading(false);
    if (requestError) {
      setError(requestError.message ?? "リクエストに失敗しました");
      return;
    }
    setSent(true);
  }

  if (sent) {
    return (
      <p className="auth-notice">
        入力されたメールアドレスが登録済みであれば、パスワード再設定用のリンクを送信しました。メールをご確認ください。
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        メールアドレス
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? "送信中..." : "再設定リンクを送信"}
      </button>
    </form>
  );
}
