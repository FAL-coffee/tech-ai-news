import { countUsersForAdmin, listUsersForAdmin } from "@tech-ai-news/db";
import Link from "next/link";
import { AdminUserList } from "../../../components/AdminUserList";
import { isAdminEmail } from "../../../lib/admin";
import { getDb } from "../../../lib/db";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 50;

interface PageProps {
  searchParams: Promise<{ q?: string; page?: string }>;
}

export default async function AdminUsersPage({ searchParams }: PageProps) {
  const { q, page: pageParam } = await searchParams;
  const search = q?.trim() ?? "";
  const page = Math.max(1, Number(pageParam) || 1);

  const db = getDb();
  const [users, total] = await Promise.all([
    listUsersForAdmin(db, { search, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE }),
    countUsersForAdmin(db, search),
  ]);

  const rows = users.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    isAdmin: isAdminEmail(user.email),
    subscriptionStatus: user.subscriptionStatus,
    subscriptionPlan: user.subscriptionPlan,
  }));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <form className="search-bar" action="/admin/users" method="get">
        <input type="search" name="q" defaultValue={search} placeholder="メールアドレス・名前で検索" />
        <button type="submit" className="btn btn-secondary">
          検索
        </button>
      </form>

      <p className="meta">{total}件のユーザー</p>

      <AdminUserList users={rows} />

      {totalPages > 1 && (
        <div className="pagination">
          {page > 1 && (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(page - 1) })}`}
              className="btn btn-secondary btn-small"
            >
              前へ
            </Link>
          )}
          <span className="meta">
            {page} / {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/admin/users?${new URLSearchParams({ ...(search ? { q: search } : {}), page: String(page + 1) })}`}
              className="btn btn-secondary btn-small"
            >
              次へ
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
