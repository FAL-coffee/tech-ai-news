-- 収集先候補の信頼度スコア(0-100)。大手企業の公式ドメイン一致・フィード自動検出・発見回数から算出する
-- (計算ロジックはapps/api側に置く。ここは値を保持するだけ)。一覧の並び替え・自動承認の判定に使う。
alter table source_candidates add column trust_score int not null default 0;
create index source_candidates_trust_score_idx on source_candidates (trust_score desc);
