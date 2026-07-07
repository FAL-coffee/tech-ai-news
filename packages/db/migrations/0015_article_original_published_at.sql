-- articles.published_at は「当サイトで公開した日時」(insert時のnow())であり、原文の公開日時とは異なる。
-- 記事詳細で原文の公開日時も表示できるよう、別カラムとして保持する(取得できない場合はnullを許容)。
alter table articles add column original_published_at timestamptz;
