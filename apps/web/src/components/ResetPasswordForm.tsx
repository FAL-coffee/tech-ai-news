"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import { authClient } from "../lib/auth-client";

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const { error: resetError } = await authClient.resetPassword({ newPassword, token });
    setLoading(false);
    if (resetError) {
      setError(resetError.message ?? "パスワードの再設定に失敗しました");
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <div>
        <p className="auth-notice">パスワードを再設定しました。新しいパスワードでログインしてください。</p>
        <button type="button" className="btn btn-primary btn-block" onClick={() => router.push("/login")}>
          ログインへ
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <label>
        新しいパスワード
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          minLength={8}
          required
        />
      </label>
      {error && <p className="form-error">{error}</p>}
      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? "設定中..." : "パスワードを再設定"}
      </button>
    </form>
  );
}
