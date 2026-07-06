-- Hacker News経由で「既存の信頼済み公式ドメインにリンクする記事」を発見する収集方式を追加するため、
-- sources.kind に 'hn_domain' を許可する。
alter table sources drop constraint sources_kind_check;
alter table sources add constraint sources_kind_check
  check (kind in ('rss', 'atom', 'github_releases', 'bluesky', 'newsletter', 'manual', 'hn_domain'));

-- 同一記事がRSSとHN経由の発見など複数ソースから重複して raw_items に入り、
-- 二重に記事生成されることを防ぐため、external_url をソース横断でグローバルに一意化する。
-- (旧: unique(source_id, external_url) は external_url 単体のunique制約に包含されるため置き換え)
alter table raw_items drop constraint raw_items_source_id_external_url_key;
alter table raw_items add constraint raw_items_external_url_key unique (external_url);
