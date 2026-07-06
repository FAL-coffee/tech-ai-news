-- 英語版記事の生成・配信は行わない方針にしたため、articlesを日本語専用に簡略化する。
-- title_en/summary_en/body_enは削除し、title_ja/summary_ja/body_jaはサフィックスを外す。
alter table articles drop column title_en;
alter table articles drop column summary_en;
alter table articles drop column body_en;

alter table articles rename column title_ja to title;
alter table articles rename column summary_ja to summary;
alter table articles rename column body_ja to body;
