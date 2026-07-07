import { listAutoApprovedSourceCandidates, listSourceCandidates } from "@tech-ai-news/db";
import { SourceCandidateList } from "../../../components/SourceCandidateList";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const db = getDb();
  const [candidates, autoApproved] = await Promise.all([
    listSourceCandidates(db, "pending"),
    listAutoApprovedSourceCandidates(db, 10),
  ]);

  return (
    <div>
      {autoApproved.length > 0 && (
        <div className="auto-approved-note">
          <strong>信頼度スコアによる自動承認(直近{autoApproved.length}件):</strong>{" "}
          {autoApproved.map((c) => c.domain).join(", ")}
        </div>
      )}
      <SourceCandidateList candidates={candidates} />
    </div>
  );
}
