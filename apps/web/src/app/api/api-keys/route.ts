import { createApiKey, listApiKeysByUser } from "@tech-ai-news/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { generateApiKey } from "../../../lib/apiKeys";
import { auth } from "../../../lib/auth";
import { getDb } from "../../../lib/db";

const MAX_NAME_LENGTH = 50;

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const keys = await listApiKeysByUser(db, session.user.id);
  return NextResponse.json({ keys });
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, MAX_NAME_LENGTH) : "default";

  const { token, tokenHash, tokenPrefix } = generateApiKey();
  const db = getDb();
  const key = await createApiKey(db, { userId: session.user.id, tokenHash, tokenPrefix, name });

  // 生トークンはここで一度だけ返す(DBにはハッシュのみ保存されるため、以後は再表示できない)。
  return NextResponse.json({ key, token });
}
