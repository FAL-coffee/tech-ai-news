import { deleteApiKey } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "../../../../lib/auth";
import { getDb } from "../../../../lib/db";

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const db = getDb();
  await deleteApiKey(db, session.user.id, id);

  return NextResponse.json({ ok: true });
}
