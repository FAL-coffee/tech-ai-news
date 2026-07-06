const USER_AGENT = "tech-ai-news-bot/0.1 (+https://github.com/FAL-coffee/tech-ai-news)";

export interface BlueskyPost {
  title: string;
  link: string;
  isoDate: string | null;
  contentText: string;
}

interface BlueskyFeedEntry {
  reason?: unknown; // 値が存在する場合はリポスト(リポスト元投稿は収集対象にしない)
  post?: {
    uri?: string;
    author?: { handle?: string };
    record?: { text?: string; createdAt?: string };
  };
}

/**
 * Bluesky公式アカウントの投稿を取得する(公開API、認証不要)。
 * `sources.url` には `https://bsky.app/profile/<handle>` の形式で保存する想定。
 */
export async function fetchBlueskyAuthorFeed(profileUrl: string, limit = 20): Promise<BlueskyPost[]> {
  const handle = profileUrl.replace(/^https?:\/\/bsky\.app\/profile\//, "").replace(/\/$/, "");
  if (!handle) {
    throw new Error(`invalid bluesky profile url: ${profileUrl}`);
  }

  const params = new URLSearchParams({
    actor: handle,
    limit: String(limit),
    filter: "posts_no_replies",
  });
  const res = await fetch(`https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed?${params}`, {
    headers: { "user-agent": USER_AGENT },
  });
  if (!res.ok) {
    throw new Error(`bluesky fetch failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as { feed?: BlueskyFeedEntry[] };
  const feed = Array.isArray(data.feed) ? data.feed : [];

  const posts: BlueskyPost[] = [];
  for (const entry of feed) {
    if (entry.reason) continue; // リポストはスキップ
    const post = entry.post;
    const text = post?.record?.text?.trim();
    const uri = post?.uri;
    if (!text || !uri) continue;

    const rkey = uri.split("/").pop();
    const authorHandle = post?.author?.handle ?? handle;
    if (!rkey) continue;

    posts.push({
      title: text.length > 100 ? `${text.slice(0, 100)}...` : text,
      link: `https://bsky.app/profile/${authorHandle}/post/${rkey}`,
      isoDate: post?.record?.createdAt ?? null,
      contentText: text,
    });
  }

  return posts;
}
