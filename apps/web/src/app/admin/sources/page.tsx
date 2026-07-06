import { listSourceCandidates } from "@tech-ai-news/db";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const db = getDb();
  const candidates = await listSourceCandidates(db, "pending");

  return (
    <div className="candidate-list">
      {candidates.length === 0 && <div className="empty-state">未承認の収集先候補はありません。</div>}
      {candidates.map((candidate) => (
        <div className="candidate-card" key={candidate.id}>
          <div className="candidate-card-header">
            <h2 className="candidate-card-title">{candidate.domain}</h2>
            <span className="pill">発見 {candidate.discoveryCount} 回</span>
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
  );
}
