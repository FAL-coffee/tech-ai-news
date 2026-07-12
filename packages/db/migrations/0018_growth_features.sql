-- 課金転換率向上のための追加機能一式(技術スタック個別化、週次ダイジェスト、重要度フィルタ、
-- Slack連携、CVE/脆弱性トラッキング、API/RSS出力)をまとめて追加する。

-- 技術スタック(「自分に関係あるか」の判定に使う。興味トピック(user_topics)とは別軸で持つ)。
create table user_stack (
  user_id text not null references "user"("id") on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);

-- 分類LLMが判定した破壊的変更・非推奨化フラグ。raw_itemsで保持し、記事生成時にarticlesへ引き継ぐ。
alter table raw_items add column breaking_change boolean not null default false;
alter table raw_items add column deprecation boolean not null default false;
alter table articles add column breaking_change boolean not null default false;
alter table articles add column deprecation boolean not null default false;

-- 週次まとめダイジェスト・重要度フィルタ・Slack連携の設定。
alter table email_preferences add column weekly_digest_enabled boolean not null default false;
alter table email_preferences add column min_importance int not null default 0;
alter table email_preferences add column slack_webhook_url text;
alter table email_preferences add column slack_enabled boolean not null default false;

create table weekly_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"("id") on delete cascade,
  sent_at timestamptz not null default now(),
  article_ids uuid[] not null,
  resend_message_id text
);
create index weekly_deliveries_user_id_sent_at_idx on weekly_deliveries (user_id, sent_at desc);

-- トピック(言語・フレームワーク・ライブラリ)とパッケージエコシステム上の実際のパッケージ名の対応。
-- CVE監視(OSV.dev)はパッケージ単位のAPIのため、トピックから引けるようにする。
create table topic_package_mappings (
  topic_id uuid not null references topics(id) on delete cascade,
  ecosystem text not null,   -- OSV.devのエコシステム名('npm', 'PyPI' 等)
  package_name text not null,
  primary key (topic_id, ecosystem, package_name)
);

insert into topics (slug, name_ja, name_en) values
  ('nextjs', 'Next.js', 'Next.js'),
  ('react', 'React', 'React'),
  ('typescript', 'TypeScript', 'TypeScript')
on conflict (slug) do nothing;

insert into topic_package_mappings (topic_id, ecosystem, package_name)
select t.id, m.ecosystem, m.package_name
from (values
  ('nextjs', 'npm', 'next'),
  ('react', 'npm', 'react'),
  ('typescript', 'npm', 'typescript')
) as m(slug, ecosystem, package_name)
join topics t on t.slug = m.slug
on conflict do nothing;

create table vulnerability_alerts (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references topics(id) on delete cascade,
  package_name text not null,
  ecosystem text not null,
  osv_id text not null unique,
  summary text not null,
  severity text,
  details_url text not null,
  discovered_at timestamptz not null default now()
);
create index vulnerability_alerts_topic_idx on vulnerability_alerts (topic_id);

create table vulnerability_alert_deliveries (
  user_id text not null references "user"("id") on delete cascade,
  vulnerability_alert_id uuid not null references vulnerability_alerts(id) on delete cascade,
  sent_at timestamptz not null default now(),
  primary key (user_id, vulnerability_alert_id)
);

-- 社内向けRSS/APIアクセス用のAPIキー。値そのものは保存せずハッシュのみ保存する。
create table api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"("id") on delete cascade,
  token_hash text not null unique,
  token_prefix text not null,
  name text not null default 'default',
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);
create index api_keys_user_idx on api_keys (user_id);
