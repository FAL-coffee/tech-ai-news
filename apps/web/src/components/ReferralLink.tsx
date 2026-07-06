"use client";

import { useState } from "react";

export function ReferralLink({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="topic-save-row">
      <input type="text" readOnly value={url} onFocus={(e) => e.target.select()} className="referral-link-input" />
      <button type="button" className="btn btn-secondary" onClick={copy}>
        コピー
      </button>
      {copied && <span className="topic-save-confirm">コピーしました</span>}
    </div>
  );
}
