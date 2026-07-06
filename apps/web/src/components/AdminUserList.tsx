"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  isAdmin: boolean;
  subscriptionStatus: string | null;
  subscriptionPlan: string | null;
}

function planLabel(status: string | null, plan: string | null): string {
  const isActive = status === "active" || status === "trialing";
  if (isActive && plan === "comp") return "無料(特別付与)";
  if (isActive) return `有料・${status}`;
  return "無料プラン";
}

export function AdminUserList({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function run(userId: string, action: string, path: string, confirmMessage?: string) {
    const key = `${userId}:${action}`;
    if (confirmMessage && !window.confirm(confirmMessage)) return;
    setPending((prev) => new Set(prev).add(key));
    startTransition(async () => {
      try {
        await fetch(path, { method: "POST" });
        router.refresh();
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
      }
    });
  }

  return (
    <div className="user-table-wrap">
      <table className="user-table">
        <thead>
          <tr>
            <th>メールアドレス</th>
            <th>登録日</th>
            <th>権限</th>
            <th>プラン</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const isActive = user.subscriptionStatus === "active" || user.subscriptionStatus === "trialing";
            const resetKey = `${user.id}:reset`;
            const subKey = `${user.id}:sub`;
            return (
              <tr key={user.id}>
                <td>{user.email}</td>
                <td>{new Date(user.createdAt).toLocaleDateString("ja-JP")}</td>
                <td>{user.isAdmin && <span className="pill">管理者</span>}</td>
                <td>{planLabel(user.subscriptionStatus, user.subscriptionPlan)}</td>
                <td>
                  <div className="user-table-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-small"
                      disabled={pending.has(resetKey)}
                      onClick={() =>
                        run(
                          user.id,
                          "reset",
                          `/api/admin/users/${user.id}/reset-password`,
                          `${user.email} にパスワード再設定メールを送信します。よろしいですか?`,
                        )
                      }
                    >
                      パスワードリセット
                    </button>
                    {isActive ? (
                      <button
                        type="button"
                        className="btn btn-danger btn-small"
                        disabled={pending.has(subKey)}
                        onClick={() =>
                          run(
                            user.id,
                            "sub",
                            `/api/admin/users/${user.id}/cancel-subscription`,
                            user.subscriptionPlan === "comp"
                              ? `${user.email} への無料アクセス付与を取り消します。よろしいですか?`
                              : `${user.email} のサブスクリプションを解除します。よろしいですか?`,
                          )
                        }
                      >
                        {user.subscriptionPlan === "comp" ? "無料アクセスを取り消す" : "サブスクを解除"}
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="btn btn-primary btn-small"
                        disabled={pending.has(subKey)}
                        onClick={() =>
                          run(
                            user.id,
                            "sub",
                            `/api/admin/users/${user.id}/grant-free`,
                            `${user.email} に無料アクセスを付与します。よろしいですか?`,
                          )
                        }
                      >
                        無料アクセスを付与
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {users.length === 0 && <div className="empty-state">ユーザーが見つかりません。</div>}
    </div>
  );
}
