-- HN経由の発見を許可するドメインの一覧をDBに移す(旧: apps/api/src/lib/trustedDomains.ts のハードコード配列)。
-- 収集先候補の承認によって行が増えていく想定。
create table trusted_domains (
  domain text primary key,
  note text,
  created_at timestamptz not null default now()
);

insert into trusted_domains (domain, note) values
  ('vercel.com', null),
  ('nextjs.org', null),
  ('react.dev', null),
  ('openai.com', null),
  ('anthropic.com', '公式RSSが無いため、HN経由の発見が特に有効なドメイン'),
  ('github.blog', null),
  ('aws.amazon.com', null),
  ('blog.cloudflare.com', null),
  ('deno.com', null),
  ('bun.com', null),
  ('bun.sh', null),
  ('devblogs.microsoft.com', null),
  ('typescriptlang.org', null)
on conflict (domain) do nothing;

-- Hacker News経由で発見された「まだ信頼済みでないドメイン」の承認待ちキュー。
create table source_candidates (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  discovery_count int not null default 1,
  sample_urls text[] not null default '{}',
  detected_feed_url text,             -- フィード自動検出で見つかった場合のURL
  detected_feed_kind text,            -- 'rss' | 'atom'
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  resulting_source_id uuid references sources(id),
  reviewed_by text references "user"(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index source_candidates_status_idx on source_candidates (status);

-- 分類LLMが既存トピックでは表現できないと判断した新規タグ候補の承認待ちキュー。
create table topic_candidates (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name_ja text not null,
  name_en text not null,
  reason text,
  occurrence_count int not null default 1,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  resulting_topic_id uuid references topics(id),
  reviewed_by text references "user"(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index topic_candidates_status_idx on topic_candidates (status);
