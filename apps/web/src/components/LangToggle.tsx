import Link from "next/link";
import type { Lang } from "@tech-ai-news/shared";

export function LangToggle({ lang }: { lang: Lang }) {
  return (
    <nav className="lang-toggle">
      <Link href="/?lang=ja" aria-current={lang === "ja" ? "page" : undefined}>
        日本語
      </Link>
      <Link href="/?lang=en" aria-current={lang === "en" ? "page" : undefined}>
        English
      </Link>
    </nav>
  );
}
