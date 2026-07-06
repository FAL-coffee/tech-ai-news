create index if not exists raw_items_status_idx on raw_items (status);
create index if not exists raw_items_source_idx on raw_items (source_id);
create index if not exists articles_published_at_idx on articles (published_at desc);
create index if not exists article_topics_topic_idx on article_topics (topic_id);

-- 拡張依存のインデックスは非対応環境でも migrate 全体を止めないようガードする。
do $$
begin
  create index if not exists articles_embedding_idx
    on articles using hnsw (embedding vector_cosine_ops);
exception when others then
  raise notice 'hnsw index on articles.embedding skipped';
end $$;

do $$
begin
  create index if not exists articles_ja_pgroonga_idx
    on articles using pgroonga (title_ja, body_ja);
exception when others then
  raise notice 'pgroonga index on articles skipped';
end $$;
