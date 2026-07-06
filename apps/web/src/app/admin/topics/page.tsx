import { listTopicCandidates } from "@tech-ai-news/db";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

export default async function AdminTopicsPage() {
  const db = getDb();
  const candidates = await listTopicCandidates(db, "pending");

  return (
    <div className="candidate-list">
      {candidates.length === 0 && <div className="empty-state">未承認のタグ候補はありません。</div>}
      {candidates.map((candidate) => (
        <div className="candidate-card" key={candidate.id}>
          <div className="candidate-card-header">
            <h2 className="candidate-card-title">
              {candidate.nameJa} <span className="pill">{candidate.slug}</span>
            </h2>
            <span className="pill">出現 {candidate.occurrenceCount} 回</span>
          </div>
          <div className="candidate-card-body">
            <p>{candidate.nameEn}</p>
            {candidate.reason && <p>提案理由: {candidate.reason}</p>}
          </div>
          <div className="candidate-actions">
            <form action={`/api/admin/topic-candidates/${candidate.id}/approve`} method="post">
              <button type="submit" className="btn btn-primary">
                承認
              </button>
            </form>
            <form action={`/api/admin/topic-candidates/${candidate.id}/reject`} method="post">
              <button type="submit" className="btn btn-danger">
                却下
              </button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
