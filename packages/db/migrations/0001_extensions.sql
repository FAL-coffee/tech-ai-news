-- pgvector は必須(埋め込みベクトル検索)
create extension if not exists vector;

-- PGroonga(日本語全文検索)は環境によって未対応(ローカルPostgres等)なため、
-- 失敗しても migrate 全体を止めないようにガードする。
do $$
begin
  create extension if not exists pgroonga;
exception when others then
  raise notice 'pgroonga unavailable; skipping (Japanese full-text index will also be skipped)';
end $$;
