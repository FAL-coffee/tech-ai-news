"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ArticleTopicTags({
  articleSlug,
  topics,
  isLoggedIn,
  initialFollowedSlugs,
}: {
  articleSlug: string;
  topics: { slug: string; nameJa: string }[];
  isLoggedIn: boolean;
  initialFollowedSlugs: string[];
}) {
  const router = useRouter();
  const [followed, setFollowed] = useState<Set<string>>(new Set(initialFollowedSlugs));
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();

  function onTagClick(slug: string) {
    if (!isLoggedIn) {
      router.push(`/login?next=${encodeURIComponent(`/articles/${articleSlug}`)}`);
      return;
    }
    setPending((prev) => new Set(prev).add(slug));
    startTransition(async () => {
      try {
        const res = await fetch("/api/topics/follow", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ slug }),
        });
        if (res.ok) {
          const data = await res.json();
          setFollowed((prev) => {
            const next = new Set(prev);
            if (data.followed) next.add(slug);
            else next.delete(slug);
            return next;
          });
        }
      } finally {
        setPending((prev) => {
          const next = new Set(prev);
          next.delete(slug);
          return next;
        });
      }
    });
  }

  return (
    <div className="article-tags">
      <span className="article-tags-label">タグ:</span>
      {topics.map(({ slug, nameJa }) => (
        <button
          key={slug}
          type="button"
          className="topic-follow-badge"
          data-followed={followed.has(slug)}
          disabled={pending.has(slug)}
          onClick={() => onTagClick(slug)}
        >
          {followed.has(slug) ? "✓ " : "+ "}
          {nameJa}
        </button>
      ))}
    </div>
  );
}
