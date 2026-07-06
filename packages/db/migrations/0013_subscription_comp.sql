-- 管理者がStripeを介さずに無料アクセスを付与できるようにする(plan='comp')。
-- comp会員はStripeの顧客/サブスクリプションを持たないため、stripe_customer_idはNULL許容にする。
alter table subscriptions alter column stripe_customer_id drop not null;
