create table subscriptions (
  user_id text primary key references "user"("id") on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  status text not null default 'none',   -- none/incomplete/incomplete_expired/trialing/active/past_due/canceled/unpaid/paused
  plan text not null default 'monthly',
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subscriptions_stripe_customer_idx on subscriptions (stripe_customer_id);

create table user_topics (
  user_id text not null references "user"("id") on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, topic_id)
);
