-- 記事の読みやすさ向上: ワンポイント要約(highlight)と、原文ページのOGP画像URLを保存する。
alter table articles add column highlight text not null default '';
alter table articles add column og_image_url text;
