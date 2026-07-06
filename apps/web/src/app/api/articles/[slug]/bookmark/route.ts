import { getArticleBySlug, toggleBookmark } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../../lib/auth";
import { getDb } from "../../../../../lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const db = getDb();
  const article = await getArticleBySlug(db, slug);
  if (!article) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { bookmarked } = await toggleBookmark(db, session.user.id, article.id);

  return NextResponse.json({ bookmarked });
}
