-- Stripeの「期間終了時に解約」フラグ。statusは期間終了まで'active'のままなので、
-- 「解約手続き済みだが、まだ利用可能」な状態をUIで区別するために保持する。
alter table subscriptions add column cancel_at_period_end boolean not null default false;
