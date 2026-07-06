# tech-ai-news 推奨仕様書 v0.1

作成日: 2026-07-06。`docs/research/` の6本の調査レポート(料金・法務は一次情報で裏取り済み)に基づく統合設計案。

---

## 1. サービスコンセプト

**「テック/AIの一次情報(公式ブログ・リリースノート)を、AIが日本語と英語の記事にして、興味トピックごとに毎朝メールで届ける」有料サービス。**

### ポジショニング(競合調査の結論)

| 軸 | 既存プレイヤー | 本サービス |
|---|---|---|
| 一次情報特化 | Techmeme(英語・要約なし) | 一次情報を**日本語でAI記事化**するサービスは不在 |
| トピック粒度×メール | TLDR(誌単位・英語・無料)、Refind(英語) | **「Next.js」「React」等のタグ粒度×日本語デイリーダイジェストは空白** |
| 日本のエンジニア向け | TechFeed/はてブ/Qiita(全て無料・広告) | 有料B2C課金は空白。ただし「無料が当たり前」の壁あり |

- **Artifactの教訓**(汎用AIニュースは市場が小さく2024年終了): 汎用化せず**テック/開発者ニッチを死守**し、「キャッチアップ時間の削減」という業務価値で課金理由を作る。
- **一次情報限定は差別化であると同時に法的リスク低減策**(§9参照)。報道記事の要約配信(Perplexity訴訟の争点)を構造的に回避できる。

### 価格(推奨)

- **個人: 月980円 / 年9,800円**(約2ヶ月分割引)。ローンチ割引780円も可
- 根拠: B2C AIニュースの床は$3(Particle+/smry)、日本の心理上限帯はSmartNews+ 1,480円〜NewsPicks 1,850円。980円×1,000人=月商98万円で運用費(§8: 月3〜5万円)を大きく上回る
- 将来: B2Bチームプラン(月3万円〜、旧Stockmark Anews帯)が単価向上の本命
- トライアル: **カード登録必須の7〜14日**(転換率31.4% vs カード不要8.9%)。特商法の最終確認画面表示+`trial_will_end`(3日前)での予告メールが必須

---

## 2. 全体アーキテクチャ(推奨構成)

「MVP最速」と「拡張前提」のバランスを取った分離構成。コスト最小の代替は§8に併記。

```
[情報源]                          [Cloudflare Workers (Hono)]
 公式ブログ RSS/Atom ──┐
 GitHub Releases .atom ─┼─→ Cron Triggers(15〜30分毎)
 コミュニティfeed ──────┘      │ 収集Worker: 条件付きGET→正規化→dedupe
 (Bluesky API / メール受信      ▼
   パース = Phase 2)      [Supabase Postgres]
                            raw_items ──→ Queues/Workflows
                                            │ ①分類・スコアリング (Claude Haiku 4.5 / Batch)
                                            │ ②記事生成 日英 (Claude Sonnet 5 / Batch)
                                            │ ③embedding (OpenAI text-embedding-3-small)
                                            ▼
                            articles + article_topics (pgvector / PGroonga)
                                            │
                            配信Worker: Cron(毎朝7:00 JST)
                            ユーザー×トピック マッチング → react-email → [Resend]
                                            │                     └ webhook(開封/クリック/バウンス)→ email_events
                                            ▼
[Next.js (Vercel Pro)]  記事閲覧 / トピック管理 / 設定 / 課金(Stripe Checkout+Portal)
[認証] Supabase Auth(またはbetter-auth)   [課金] Stripe Billing
```

### 技術スタック

| レイヤ | 採用 | 理由 |
|---|---|---|
| フロント | **Next.js on Vercel Pro($20/月)** | Vercel Hobbyは**非商用限定**のため有料アプリは初日からPro必須。記事ページのSEO/ISRが将来の集客資産 |
| API+ジョブ | **Hono on Cloudflare Workers Paid($5/月)** | HonoはCFネイティブ。$5にCron 250個+Queues 100万ops+**Workflows(LLM API待ち時間は課金されず、wall時間無制限)**が同梱。LLMバッチに最適 |
| DB | **Supabase Pro($25/月)** | pgvector(ベクトル)+**PGroonga(日本語全文検索)**+Auth+pg_cron/pgmq を1つで満たす唯一の選択肢。Freeは1週間非アクティブで停止するため本番不可 |
| 認証 | **Supabase Auth**(DBに寄せる)or better-auth | Auth.jsは新規非推奨(チームがbetter-authに合流)。Clerkは無料50k MRUでDX重視なら代替可 |
| メール | **Resend Pro($20/月・5万通)+react-email** | 東京リージョン送信対応、Next.js/TSと開発体験一致、webhookで計測。コスト最優先ならSES($3/月)だが購読解除・抑制リストの自前実装が必要 |
| 課金 | **Stripe Billing+Checkout+Customer Portal** | 日本の少額サブスクは実効約4.3%(3.6%+Billing0.7%)で固定手数料なし=手数料負けしない。MoR型(Paddle 5%+$0.50)は¥980課金で実効約13%になり不利 |
| LLM | 分類=**Haiku 4.5 Batch** / 生成=**Sonnet 5 Batch** / embedding=**OpenAI 3-small** | §7のコスト表参照。プロバイダ切替可能な抽象化レイヤを1枚挟む |
| モバイル(将来) | Expo+同じHono API | **課金はWebのみ(Netflixモデル)でIAP手数料を回避**。Expo Push無料。日本のスマホ新法(2025/12施行)で外部リンク15%(小規模10%)だがWeb課金なら0 |

### 構成の代替案

- **コスト最小(月$8〜30)**: 全Cloudflare(OpenNextでNext.jsもWorkersへ)+Neon従量($3〜10)+SES+Gemini Flash系。月固定費を1/3にできるが、OpenNextの運用の手間・日本語全文検索の工夫・メール周り自前実装が増える。**技術検証期はこちらで始めて、課金開始時に推奨構成へ寄せるのも合理的**
- **Vercel一体(月$20〜)**: Honoを`hono/vercel`アダプタでNext.jsに同居。Vercel Proはcron毎分+最大800秒なので1日数百件なら成立。運用は最もシンプルだがリトライ/キューは自前

---

## 3. 収集パイプライン

### 情報源(一次情報優先の方針を反映)

調査で**フィードURLの生存確認済み**(2026-07-05時点):

| ソース | フィード | 状態 |
|---|---|---|
| Vercel | `vercel.com/atom` | OK |
| Next.js | `nextjs.org/feed.xml` | OK |
| React | `react.dev/rss.xml` | OK(検証で復活確認。不安定な履歴があるため監視) |
| OpenAI | `openai.com/news/rss.xml` | OK |
| GitHub Blog / Changelog | `github.blog/feed/`・`github.blog/changelog/feed/` | OK |
| AWS | `aws.amazon.com/blogs/aws/feed/` | OK |
| Cloudflare | `blog.cloudflare.com/rss/` | OK |
| Deno / Bun / TypeScript | `deno.com/feed`・`bun.com/rss.xml`・`devblogs.microsoft.com/typescript/feed/` | OK |
| 任意のOSSリリース | `github.com/{owner}/{repo}/releases.atom` | 認証不要・無料 |
| Anthropic | 公式RSSなし | コミュニティfeed or ニュースレター受信パースで補完 |

→ **RSS/Atom+GitHub Releasesで9割を無料でカバーできる**。sourcesテーブルにETag/Last-Modifiedを持ち条件付きGETで負荷とコストを最小化。

### X(Twitter)の扱い — 重要な設計判断

- X APIは2026年2月に**pay-per-use化**(他者ポスト読取$0.005/件、自分のデータ$0.001/件)。新規Freeティア廃止。小規模巡回でも月数十〜数百ドル
- さらに**Developer Agreementが取得コンテンツの再配布・シンジケーションとAI学習利用を禁止** → ポスト本文をDBに保存して記事化・再配信する行為は規約違反リスクが高い
- **結論: XはMVPの情報源にしない**。(a) 公式ブログRSSでほぼ代替可能(企業の発表はブログが正)、(b) SNS由来のシグナルが欲しければ**Bluesky API(無料・審査不要)**とHacker News Algolia API(無料・10,000req/時)をPhase 2で追加。X上の話題性はHNスコア等で間接的に捕捉。逆に**完成した記事の宣伝ポスト先**としてXを使う(投稿$0.015/件は許容)

### 処理フロー

1. Cron(15〜30分毎)→ 有効なsourcesを巡回 → 新着をURL+ハッシュでdedupe → `raw_items` に保存
2. 分類ジョブ(1日数回 or Queues駆動): Haiku 4.5で「関連トピック / 重要度スコア(0-100) / 記事化する価値」を判定
3. 閾値以上のitemを記事生成キューへ(1日あたり上限N本=コストの固定化。初期は50〜100本/日)

---

## 4. 記事生成パイプライン

- **モデル**: Claude Sonnet 5(Batch API)。デイリーダイジェスト用途はリアルタイム性不要なので**全処理をBatchで回して半額**にするのが大前提。品質最優先ならOpus 4.8 Batchでも差額は月$70程度(§7)
- **日英**: 翻訳ではなく**各言語でネイティブ生成**(パターンA)。翻訳方式との差は月4〜7%しかなく品質を優先
- **プロンプト方針(法務ガードレール、§9と連動)**:
  - 「事実(何がリリースされ、何が変わったか)を抽出し、**自分の言葉で再構成**する。原文のフレーズをなぞらない」を仕様として固定
  - 全記事に**原文リンク+出典明示**を必須フィールド化
  - 要約は「原文の代替にならない粒度」(見出し+要点数段落+原文誘導)
  - 原文の一節を使う場合は引用形式(明瞭区別・主従・出所明示)に統一
- 構造化出力: title/summary/body/tags/importance を JSON Schema で受ける
- プロンプトキャッシュ: 共通システムプロンプトをキャッシュ(読取0.1倍)。Batchと併用可

---

## 5. トピックマッチング

- **2層方式**: (1) 固定タクソノミー(初期20〜30トピック: frontend, nextjs, react, typescript, ai-llm, cloud, devops, security, ...)へのタグ付け=分類LLMの出力、(2) pgvectorでの記事×ユーザー興味のembedding類似度(Phase 2でパーソナライズ強化)
- ユーザーは複数トピックを購読。トピックはslug管理で日英表示名を持つ
- 検索: 英語=Postgres標準FTS、日本語=**PGroonga**(Supabaseが標準サポート)

---

## 6. メール配信

- **毎朝7:00 JST**(ユーザー設定でタイムゾーン/頻度変更可)に、購読トピックにマッチした過去24時間の記事をダイジェスト化
- react-emailでテンプレート(記事リストをpropsで注入)→ Resendで送信
- **最初から実装必須**(Gmail大量送信者ガイドライン+特定電子メール法):
  - SPF / DKIM / DMARC(p=none→安定後quarantine)。docomoは2025年からDMARC未対応に警告表示
  - `List-Unsubscribe` + `List-Unsubscribe-Post`(RFC 8058 ワンクリック解除)
  - フッター: 事業者名・住所・問合せ先・解除リンク
  - 登録時の配信同意チェックボックス+同意日時のDB記録
  - バウンス/苦情webhookで自動配信停止(抑制リスト)
- KPIは**クリック率主軸**(Apple MPPで開封率は過大計測される)

---

## 7. LLMコスト試算(2026-07-05公式料金・裏取り済み)

前提: 収集300件/日の分類+記事100本/日×日英生成+embedding(月間 入力42M/出力10.8Mトークン)。

| 構成 | 月額(Batch適用) |
|---|---|
| 最小(Gemini 2.5 Flash-Lite/Flash) | **$12〜20** |
| **推奨バランス(分類Haiku+生成Sonnet 5+embedding)** | **約$117**(Sonnet 5イントロ価格中は約$83) |
| 品質最優先(生成をOpus 4.8に) | 約$186 |

- **1,000ユーザーでもLLM原価はユーザーあたり月$0.2以下** — コスト上のボトルネックにならない。生成コストは記事本数依存(ユーザー数非依存)なのがこのモデルの強み
- 注意: **Sonnet 5のイントロ価格($2/$10)は2026-08-31終了**。予算は標準価格$3/$15で計画
- 注意: Sonnet 5/Opus 4.7以降は新トークナイザで同一テキスト約+30%(Haiku 4.5は旧のまま)。`count_tokens`で実測してから確定

## 8. 月額ランニングコスト全体

| 項目 | 推奨構成 | コスト最小構成 |
|---|---|---|
| フロント | Vercel Pro $20 | CF Workersに同居 $0 |
| API/ジョブ | CF Workers Paid $5 | CF Workers Paid $5 |
| DB/認証 | Supabase Pro $25 | Neon従量 $3〜10 |
| メール | Resend Pro $20(〜5万通) | SES $3 |
| LLM | $83〜117 | $12〜20 |
| **合計** | **約$155〜190/月(≒2.3〜2.9万円)** | **約$25〜40/月** |

- これに決済手数料(売上の約4.3%)とドメイン代。**月980円なら有料30人で固定費回収**
- 5,000ユーザー時もメールが$80になる程度で、インフラはほぼ据え置きでスケール

---

## 9. 法的考慮事項(要点)

調査詳細: `docs/research/02-sources-and-legal.md`

**低リスク(本サービスの基本設計)**
1. 公式RSS/Atom・GitHub Releases等、**提供者が公開した経路のみで収集**(robots.txt遵守・UA明示・適切な間隔) → 収集・LLM解析自体は著作権法30条の4で原則適法
2. 「リリースされた・変わった」という**事実は著作権の保護対象外**(10条2項)。事実ベースで自分の言葉の記事化は本質的に低リスク
3. 全記事に原文リンク+出典明示。引用は32条要件(明瞭区別・主従・出所明示)

**高リスク(構造的に回避)**
1. **報道機関の記事の網羅的要約配信** — 読売(21.7億円)・朝日/日経(44億円)対Perplexity訴訟の争点そのもの。**情報源をベンダー公式に限定する本方針が最大の防御**
2. 全文転載・全文翻訳の配信(翻案権)。「要約が原文の代替になる」粒度も47条の5で正当化できない
3. X APIコンテンツのDB保存・再配信(Developer Agreement違反)
4. ペイウォール内・robots.txt回避のクロール(30条の4ただし書)
5. 特定ソースへの網羅的タダ乗り(著作権非侵害でもYOL事件型の不法行為リスク)→ ソースを分散、削除請求窓口を規約に整備

**メール・取引関連**: 特定電子メール法(同意取得・表示義務・記録保存)、特商法(トライアル最終確認画面)、Gmail送信者ガイドライン — §1・§6に組み込み済み

---

## 10. DBスキーマ(主要テーブル案)

```sql
create table sources (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  kind text not null check (kind in ('rss','atom','github_releases','bluesky','newsletter','manual')),
  url text not null unique,
  etag text, last_modified text,
  fetch_interval_min int not null default 30,
  last_fetched_at timestamptz,
  enabled boolean not null default true,
  created_at timestamptz not null default now()
);

create table raw_items (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references sources(id),
  external_url text not null,
  title text not null,
  content_text text,
  content_hash text not null,
  published_at timestamptz,
  fetched_at timestamptz not null default now(),
  status text not null default 'new'
    check (status in ('new','classified','selected','generated','skipped')),
  importance int,            -- 0-100 (分類LLMの出力)
  topics text[],             -- 分類LLMの暫定タグ
  unique (source_id, external_url),
  unique (content_hash)
);

create table articles (
  id uuid primary key default gen_random_uuid(),
  raw_item_id uuid references raw_items(id),
  slug text not null unique,
  title_ja text not null, title_en text not null,
  summary_ja text not null, summary_en text not null,
  body_ja text not null, body_en text not null,
  original_url text not null,      -- 原文リンク(必須=法務ガードレール)
  source_name text not null,       -- 出典明示
  importance int not null,
  model text not null,             -- 生成モデルの記録
  embedding vector(1536),          -- pgvector
  published_at timestamptz not null default now(),
  status text not null default 'published' check (status in ('draft','published','retracted'))
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,       -- 'nextjs', 'react', 'ai-llm', ...
  name_ja text not null, name_en text not null,
  embedding vector(1536)
);

create table article_topics (
  article_id uuid references articles(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  score real not null default 1.0,
  primary key (article_id, topic_id)
);

-- users は Supabase Auth (auth.users) を利用
create table profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  language text not null default 'ja' check (language in ('ja','en')),
  digest_hour int not null default 7,
  timezone text not null default 'Asia/Tokyo',
  email_consent_at timestamptz          -- 特電法: 同意日時の記録
);

create table user_topics (
  user_id uuid references auth.users(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  primary key (user_id, topic_id)
);

create table subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id text not null,
  stripe_subscription_id text,
  status text not null,               -- trialing/active/past_due/canceled
  plan text not null default 'monthly',
  trial_end timestamptz,
  current_period_end timestamptz
);

create table deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  sent_at timestamptz not null default now(),
  article_ids uuid[] not null,
  resend_message_id text
);

create table email_events (
  id uuid primary key default gen_random_uuid(),
  delivery_id uuid references deliveries(id),
  event text not null,   -- delivered/opened/clicked/bounced/complained
  url text,              -- クリックの場合
  occurred_at timestamptz not null
);

create table suppressions (   -- バウンス/苦情の自動配信停止
  email text primary key,
  reason text not null,
  created_at timestamptz not null default now()
);
```

---

## 11. MVPスコープとロードマップ

### Phase 1: MVP(目安 6〜8週間)

**入れる**
- 厳選30〜50ソース(RSS/GitHub Releases)の収集
- 固定トピック20〜30種+分類・重要度スコアリング
- 日英記事生成(Sonnet 5 Batch)+記事一覧/詳細ページ
- トピック購読+毎朝のメールダイジェスト(Resend+react-email、法令対応込み)
- Supabase Auth+Stripe(月額/年額、カード必須7日トライアル、Customer Portal)
- 運用ダッシュボード最小限(生成失敗の再実行、ソース死活)

**入れない(Phase 2以降)**
- Bluesky/HNシグナル、ニュースレター受信パース(Anthropic補完)
- embeddingパーソナライズ(「あなた向け」ランキング)、週次まとめ
- モバイルアプリ(Expo)、プッシュ通知
- B2Bチームプラン、Slack/Discord配信、公開API
- 英語圏向けマーケティング(記事は最初から英語版も生成して資産化だけしておく)

### 検証優先の進め方(推奨)

1. **Week 1-2**: 収集+生成パイプラインだけ作り、**自分専用ダイジェスト**を毎朝受け取る(Gemini無料ティア/Supabase Freeで$0開発)
2. **Week 3-4**: 記事品質のチューニング+Web最小構成
3. **Week 5-8**: 課金・認証・法令対応を実装してクローズドβ(知人エンジニア10〜30人に無料コード配布)→ 転換率とクリック率で判断してから本ローンチ

---

## 12. 主要リスクと対策

| リスク | 対策 |
|---|---|
| 無料競合(TLDR/はてブ/TechFeed)が強い | 「日本語×一次情報×トピック粒度×毎朝」の束で差別化。無料側に流れる層は追わない |
| 記事品質がコモディティ化 | 重要度スコアの精度と「読む価値の選別」に投資。生成文はスタイルガイドで統一 |
| Sonnet 5イントロ価格終了(2026-08-31) | 標準価格で予算計画済み。プロバイダ抽象化でGemini/GPTへ切替可能に |
| React等のフィードURL変更・消滅 | ソース死活監視+GitHub Releases atomをフォールバックに |
| X起点の速報を取りこぼす | 公式ブログが正であり許容。Phase 2でBluesky/HN補完 |
| 規約・法改正(スマホ新法、Perplexity判決) | Web課金のみ・一次情報限定の設計で影響を最小化。判決動向をウォッチ |

---

## 13. 未決事項(要判断)

1. **サービス名・ドメイン**
2. 価格の最終決定(980円案 vs 780円ローンチ価格)と年額プランの有無
3. 初期トピックタクソノミーの確定(どの30トピックから始めるか=想定読者像の確定)
4. 記事の一般公開範囲(全文は会員限定+一覧/要約は公開してSEO資産化、が推奨)
5. 開発を推奨構成($50/月)で始めるか、コスト最小構成($10/月)で検証してから移行するか
