-- 記事へのいいね・ブックマーク。いいねは公開の件数として表示し、ブックマークは本人のみ閲覧する。
create table article_likes (
  user_id text not null references "user"("id") on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
create index article_likes_article_idx on article_likes (article_id);

create table article_bookmarks (
  user_id text not null references "user"("id") on delete cascade,
  article_id uuid not null references articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);
create index article_bookmarks_user_idx on article_bookmarks (user_id, created_at desc);
