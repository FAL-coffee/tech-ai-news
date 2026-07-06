-- メールダイジェスト配信(トピック購読済みユーザーへの新着記事通知)のための基盤。
-- 特定電子メール法対応: consent_at(同意日時の記録)、unsubscribe_token(ログイン不要のワンクリック配信停止)、
-- suppressions(配信停止・苦情の恒久的な送信除外リスト)。

create table email_preferences (
  user_id text primary key references "user"("id") on delete cascade,
  digest_enabled boolean not null default false,
  consent_at timestamptz,              -- オプトイン同意日時。未同意ならnull
  unsubscribe_token text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references "user"("id") on delete cascade,
  sent_at timestamptz not null default now(),
  article_ids uuid[] not null,
  resend_message_id text
);
create index deliveries_user_id_sent_at_idx on deliveries (user_id, sent_at desc);

create table suppressions (
  email text primary key,
  reason text not null,   -- unsubscribe / bounce / complaint
  created_at timestamptz not null default now()
);
