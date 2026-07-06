-- 紹介プログラム: 誰が誰を紹介して登録したかを記録する。
-- 1人の被紹介者(referee)は1回しか紹介元を持てない(先着で確定、後からの上書きはしない)。
create table referrals (
  referee_user_id text primary key references "user"("id") on delete cascade,
  referrer_user_id text not null references "user"("id") on delete cascade,
  created_at timestamptz not null default now()
);
create index referrals_referrer_idx on referrals (referrer_user_id);
