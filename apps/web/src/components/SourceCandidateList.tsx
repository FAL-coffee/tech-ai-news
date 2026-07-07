"use client";

import type { SourceCandidate } from "@tech-ai-news/shared";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

type SortKey = "trustScore" | "discoveryCount" | "createdAt";

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "trustScore", label: "信頼度スコアが高い順" },
  { key: "discoveryCount", label: "発見回数が多い順" },
  { key: "createdAt", label: "新着順" },
];

function trustScoreTier(score: number): "high" | "medium" | "low" {
  if (score >= 80) return "high";
  if (score >= 50) return "medium";
  return "low";
}

export function SourceCandidateList({ candidates }: { candidates: SourceCandidate[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();
  const [sortKey, setSortKey] = useState<SortKey>("trustScore");

  const sortedCandidates = useMemo(() => {
    const copy = [...candidates];
    copy.sort((a, b) => {
      if (sortKey === "trustScore") return b.trustScore - a.trustScore;
      if (sortKey === "discoveryCount") return b.discoveryCount - a.discoveryCount;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
    return copy;
  }, [candidates, sortKey]);

  const allSelected = candidates.length > 0 && selected.size === candidates.length;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(candidates.map((c) => c.id)));
  }

  function runBulkAction(action: "approve" | "reject") {
    if (selected.size === 0) return;
    const label = action === "approve" ? "承認" : "却下";
    if (!window.confirm(`選択した${selected.size}件を${label}します。よろしいですか?`)) return;

    startTransition(async () => {
      await fetch("/api/admin/source-candidates/bulk", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: Array.from(selected), action }),
      });
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <div>
      {candidates.length > 0 && (
        <div className="candidate-bulk-bar">
          <label className="consent-checkbox">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} disabled={isPending} />
            <span>全選択({selected.size}/{candidates.length}件選択中)</span>
          </label>
          <label className="candidate-sort-select">
            並び替え:
            <select value={sortKey} onChange={(e) => setSortKey(e.target.value as SortKey)}>
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
          <div className="candidate-bulk-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={selected.size === 0 || isPending}
              onClick={() => runBulkAction("approve")}
            >
              選択した{selected.size}件を承認
            </button>
            <button
              type="button"
              className="btn btn-danger"
              disabled={selected.size === 0 || isPending}
              onClick={() => runBulkAction("reject")}
            >
              選択した{selected.size}件を却下
            </button>
          </div>
        </div>
      )}

      <div className="candidate-list">
        {candidates.length === 0 && <div className="empty-state">未承認の収集先候補はありません。</div>}
        {sortedCandidates.map((candidate) => (
          <div className="candidate-card" key={candidate.id}>
            <div className="candidate-card-header">
              <label className="consent-checkbox">
                <input
                  type="checkbox"
                  checked={selected.has(candidate.id)}
                  onChange={() => toggle(candidate.id)}
                  disabled={isPending}
                />
                <h2 className="candidate-card-title">{candidate.domain}</h2>
              </label>
              <div className="candidate-card-badges">
                <span className={`trust-score-badge trust-score-${trustScoreTier(candidate.trustScore)}`}>
                  信頼度スコア {candidate.trustScore}
                </span>
                <span className="pill">発見 {candidate.discoveryCount} 回</span>
              </div>
            </div>
            <div className="candidate-card-body">
              <p>
                {candidate.detectedFeedUrl ? (
                  <>
                    フィード検出: <span className="pill">{candidate.detectedFeedKind}</span>{" "}
                    <a href={candidate.detectedFeedUrl} target="_blank" rel="noopener noreferrer">
                      {candidate.detectedFeedUrl}
                    </a>
                  </>
                ) : (
                  "フィードは自動検出できませんでした(承認してもsourcesには追加されません)"
                )}
              </p>
              {candidate.sampleUrls.length > 0 && (
                <ul className="candidate-sample-urls">
                  {candidate.sampleUrls.slice(0, 3).map((url) => (
                    <li key={url}>
                      <a href={url} target="_blank" rel="noopener noreferrer">
                        {url}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="candidate-actions">
              <form action={`/api/admin/source-candidates/${candidate.id}/approve`} method="post">
                <button type="submit" className="btn btn-primary">
                  承認
                </button>
              </form>
              <form action={`/api/admin/source-candidates/${candidate.id}/reject`} method="post">
                <button type="submit" className="btn btn-danger">
                  却下
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
