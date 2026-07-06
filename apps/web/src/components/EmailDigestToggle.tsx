"use client";

import { useState, useTransition } from "react";

export function EmailDigestToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function save(next: boolean) {
    setEnabled(next);
    setSaved(false);
    startTransition(async () => {
      await fetch("/api/email-preferences", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ digestEnabled: next }),
      });
      setSaved(true);
    });
  }

  return (
    <div className="topic-save-row">
      <label className="consent-checkbox">
        <input type="checkbox" checked={enabled} disabled={isPending} onChange={(e) => save(e.target.checked)} />
        <span>新着記事のメールダイジェストを受け取る</span>
      </label>
      {saved && !isPending && <span className="topic-save-confirm">保存しました</span>}
    </div>
  );
}
