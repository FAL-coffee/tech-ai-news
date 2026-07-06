create table sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('rss','atom','github_releases','bluesky','newsletter','manual')),
  url text not null unique,
  etag text,
  last_modified text,
  fetch_interval_min int not null default 30,
  last_fetched_at timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table raw_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id),
  external_url text not null,
  title text not null,
  content_text text,
  content_hash text not null,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new','selected','skipped','generated')),
  importance int,            -- 0-100 (分類LLMの出力)
  topics text[],             -- 分類LLMの暫定タグ(topics.slugの配列)
  last_error text,           -- 分類/生成失敗時のエラーメッセージ(自動リトライ用)
  unique (source_id, external_url),
  unique (content_hash)
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,       -- 'nextjs', 'react', 'ai-llm', ...
  name_ja text not null,
  name_en text not null,
  embedding vector(1536)
);

create table articles (
  id uuid primary key default gen_random_uuid(),
  raw_item_id uuid references raw_items(id),
  slug text not null unique,
  title_ja text not null,
  title_en text not null,
  summary_ja text not null,
  summary_en text not null,
  body_ja text not null,
  body_en text not null,
  original_url text not null,      -- 原文リンク(必須=法務ガードレール)
  source_name text not null,       -- 出典明示
  importance int not null,
  model text not null,             -- 生成モデルの記録
  embedding vector(1536),
  published_at timestamptz not null default now(),
  status text not null default 'published' check (status in ('draft','published','retracted'))
);

create table article_topics (
  article_id uuid references articles(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  score real not null default 1.0,
  primary key (article_id, topic_id)
);
