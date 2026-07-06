import { listSourceCandidates, listTopicCandidates } from "@tech-ai-news/db";
import Link from "next/link";
import { getDb } from "../../lib/db";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const db = getDb();
  const [pendingSources, pendingTopics] = await Promise.all([
    listSourceCandidates(db, "pending"),
    listTopicCandidates(db, "pending"),
  ]);

  return (
    <div className="admin-stat-grid">
      <Link href="/admin/sources" className="admin-stat-card">
        <div className="admin-stat-value">{pendingSources.length}</div>
        <div className="admin-stat-label">未承認の収集先候補</div>
      </Link>
      <Link href="/admin/topics" className="admin-stat-card">
        <div className="admin-stat-value">{pendingTopics.length}</div>
        <div className="admin-stat-label">未承認のタグ候補</div>
      </Link>
    </div>
  );
}
