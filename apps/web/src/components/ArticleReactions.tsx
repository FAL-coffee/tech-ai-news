"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ArticleReactions({
  slug,
  isLoggedIn,
  initialLiked,
  initialLikeCount,
  initialBookmarked,
}: {
  slug: string;
  isLoggedIn: boolean;
  initialLiked: boolean;
  initialLikeCount: number;
  initialBookmarked: boolean;
}) {
  const router = useRouter();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [isPending, startTransition] = useTransition();

  function requireLogin() {
    router.push(`/login?next=${encodeURIComponent(`/articles/${slug}`)}`);
  }

  function onLike() {
    if (!isLoggedIn) return requireLogin();
    startTransition(async () => {
      const res = await fetch(`/api/articles/${slug}/like`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setLiked(data.liked);
      setLikeCount(data.likeCount);
    });
  }

  function onBookmark() {
    if (!isLoggedIn) return requireLogin();
    startTransition(async () => {
      const res = await fetch(`/api/articles/${slug}/bookmark`, { method: "POST" });
      if (!res.ok) return;
      const data = await res.json();
      setBookmarked(data.bookmarked);
    });
  }

  return (
    <div className="article-reactions">
      <button
        type="button"
        className="reaction-button"
        data-active={liked}
        disabled={isPending}
        onClick={onLike}
        aria-pressed={liked}
      >
        <svg viewBox="0 0 24 24" fill={liked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
          <path d="M12 20.5s-7.5-4.6-9.6-9.1C1 8.1 2.4 5 5.6 5c1.9 0 3.3 1 4.4 2.6C11.1 6 12.5 5 14.4 5c3.2 0 4.6 3.1 3.2 6.4C15.5 15.9 12 20.5 12 20.5z" />
        </svg>
        いいね {likeCount > 0 && <span>{likeCount}</span>}
      </button>
      <button
        type="button"
        className="reaction-button"
        data-active={bookmarked}
        disabled={isPending}
        onClick={onBookmark}
        aria-pressed={bookmarked}
      >
        <svg viewBox="0 0 24 24" fill={bookmarked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
          <path d="M6 3.5h12a.5.5 0 0 1 .5.5v17l-6.5-4-6.5 4v-17a.5.5 0 0 1 .5-.5z" />
        </svg>
        {bookmarked ? "ブックマーク済み" : "ブックマーク"}
      </button>
    </div>
  );
}
