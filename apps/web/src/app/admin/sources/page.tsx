import { listSourceCandidates } from "@tech-ai-news/db";
import { SourceCandidateList } from "../../../components/SourceCandidateList";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  const db = getDb();
  const candidates = await listSourceCandidates(db, "pending");

  return <SourceCandidateList candidates={candidates} />;
}
