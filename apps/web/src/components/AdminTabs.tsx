"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/admin", label: "概要" },
  { href: "/admin/sources", label: "収集先候補" },
  { href: "/admin/topics", label: "タグ候補" },
  { href: "/admin/users", label: "ユーザー" },
];

export function AdminTabs() {
  const pathname = usePathname();

  return (
    <nav className="admin-tabs">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} className="admin-tab" aria-current={pathname === tab.href ? "page" : undefined}>
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
