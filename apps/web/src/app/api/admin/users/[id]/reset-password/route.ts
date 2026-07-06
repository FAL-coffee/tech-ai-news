import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { isAdminEmail } from "../../../../../../lib/admin";
import { auth, getAuth } from "../../../../../../lib/auth";
import { getDb } from "../../../../../../lib/db";

export async function POST(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminEmail(session.user.email)) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  const rows = await db`select "email" from "user" where "id" = ${id}`;
  if (rows.length === 0) {
    return NextResponse.json({ error: "user not found" }, { status: 404 });
  }

  await getAuth().api.requestPasswordReset({
    body: { email: rows[0].email, redirectTo: "/reset-password" },
  });

  return NextResponse.json({ ok: true });
}
