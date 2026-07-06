import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminTabs } from "../../components/AdminTabs";
import { isAdminEmail } from "../../lib/admin";
import { auth } from "../../lib/auth";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login?next=/admin");
  }
  // 管理者以外には画面の存在自体を明かさない(403ではなく404)。
  if (!isAdminEmail(session.user.email)) {
    notFound();
  }

  return (
    <main className="page">
      <div className="header">
        <h1 className="hero-title">Admin</h1>
      </div>
      <AdminTabs />
      {children}
    </main>
  );
}
