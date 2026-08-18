import { redirect } from "next/navigation";

interface PageProps {
  searchParams: Promise<{ topic?: string }>;
}

// トピック一覧ページは廃止し、トピック別・新着順の一覧を持つ/archiveに統合した。
export default async function TopicsPage({ searchParams }: PageProps) {
  const { topic } = await searchParams;
  redirect(topic ? `/archive?topic=${encodeURIComponent(topic)}` : "/archive");
}
