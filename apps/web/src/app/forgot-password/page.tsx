import Link from "next/link";
import { ForgotPasswordForm } from "../../components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <main className="page auth-page">
      <div className="auth-card">
        <h1>パスワード再設定</h1>
        <p className="auth-subtitle">登録済みのメールアドレスを入力してください</p>
        <ForgotPasswordForm />
        <p className="auth-footer">
          <Link href="/login">ログインに戻る</Link>
        </p>
      </div>
    </main>
  );
}
