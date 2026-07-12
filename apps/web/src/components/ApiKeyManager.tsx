"use client";

import type { ApiKeySummary } from "@tech-ai-news/shared";
import { useState, useTransition } from "react";

export function ApiKeyManager({ initialKeys }: { initialKeys: ApiKeySummary[] }) {
  const [keys, setKeys] = useState<ApiKeySummary[]>(initialKeys);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function createKey() {
    startTransition(async () => {
      const res = await fetch("/api/api-keys", { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setKeys((prev) => [data.key, ...prev]);
      setNewToken(data.token);
    });
  }

  function revokeKey(id: string) {
    startTransition(async () => {
      await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      setKeys((prev) => prev.filter((k) => k.id !== id));
    });
  }

  return (
    <div>
      <p className="meta">興味のあるトピックの新着記事を、社内ツールなどからJSON APIで取得できます(有料プラン限定)。</p>

      {newToken && (
        <div className="api-key-new-token">
          <p>
            <strong>新しいAPIキーが発行されました。この画面を離れると二度と表示できません。</strong>
          </p>
          <code>{newToken}</code>
        </div>
      )}

      {keys.length > 0 && (
        <ul className="api-key-list">
          {keys.map((key) => (
            <li key={key.id}>
              <span>
                {key.name} · <code>{key.tokenPrefix}...</code>
              </span>
              <button type="button" className="btn btn-danger btn-small" onClick={() => revokeKey(key.id)} disabled={isPending}>
                失効
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="card-actions">
        <button type="button" className="btn btn-secondary" onClick={createKey} disabled={isPending}>
          {isPending ? "作成中..." : "新しいAPIキーを発行"}
        </button>
      </div>
      <p className="meta">
        利用例: <code>GET {"{siteUrl}"}/api/v1/articles</code>(<code>Authorization: Bearer &lt;APIキー&gt;</code>)。 サイト全体のRSSは{" "}
        <code>/feed.xml</code> で認証不要で購読できます。
      </p>
    </div>
  );
}
