-- 記事の更新日時。既存記事は公開日時で初期化し、以後の更新はトリガーで自動記録する。
alter table articles add column updated_at timestamptz not null default now();
update articles set updated_at = published_at;

create function set_articles_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger articles_set_updated_at
  before update on articles
  for each row execute function set_articles_updated_at();

-- Resend webhook経由のメールイベント記録(docs/spec.md §2: webhook(開封/クリック/バウンス)→ email_events)。
-- bounce/complaintはsuppressionsへの追加判断の証跡にもなる。
create table email_events (
  id uuid primary key default gen_random_uuid(),
  resend_email_id text,
  email text not null,
  event_type text not null,   -- delivered / bounced / complained / opened / clicked など
  payload jsonb,
  created_at timestamptz not null default now()
);
create index email_events_email_idx on email_events (email, created_at desc);
