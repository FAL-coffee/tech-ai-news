"use client";

import type { Topic } from "@tech-ai-news/shared";
import { useState, useTransition } from "react";

export function TopicSelector({ topics, initialSelected }: { topics: Topic[]; initialSelected: string[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set(initialSelected));
  const [isPending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
    setSaved(false);
  }

  function save() {
    startTransition(async () => {
      await fetch("/api/topics", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ topics: Array.from(selected) }),
      });
      setSaved(true);
    });
  }

  return (
    <div>
      <div className="topics">
        {topics.map((topic) => (
          <label key={topic.slug} className="topic-checkbox">
            <input type="checkbox" checked={selected.has(topic.slug)} onChange={() => toggle(topic.slug)} />
            {topic.nameJa}
          </label>
        ))}
      </div>
      <button type="button" onClick={save} disabled={isPending}>
        {isPending ? "保存中..." : "保存"}
      </button>
      {saved && !isPending && <span> 保存しました</span>}
    </div>
  );
}
