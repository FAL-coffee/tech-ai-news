# tech-ai-news

テック/AI一次情報(公式ブログ・GitHub Releases等)を収集し、AIで日本語の記事を生成して配信するサービス。

**Phase 1(収集→分類→生成パイプライン + 閲覧用Web)+ Phase 2(認証・Stripe課金・トピック購読・記事ペイウォール)+ Phase 3(自動実行スケジューラ・収集先/タグ候補の自動発見と承認画面)+ Phase 4(メールダイジェスト配信・SEO基盤によるグロース施策)を実装済み**です。実デプロイ(Cloudflare Workers等)は未実装です。詳細な仕様・調査は [`docs/spec.md`](./docs/spec.md) を参照してください。

## 構成

```
apps/
  api/    Hono製API。収集・分類・生成の3ジョブを実行(HTTP経由 or CLIスクリプト)
  web/    Next.js製Web。記事閲覧(ペイウォール)、認証、Stripe課金、トピック購読
packages/
  db/     Postgresマイグレーション・シード・クライアント
  llm/    Anthropic Claude(分類・記事生成)、OpenAI(embedding)のラッパー
  shared/ 共通型定義
```

## セットアップ

### 1. 依存関係のインストール

```sh
pnpm install
```

### 2. Postgres の用意

pgvector 拡張が使える Postgres が必要です。ローカルで試す場合:

```sh
docker run -d --name tech-ai-news-db -p 5432:5432 \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=tech_ai_news \
  pgvector/pgvector:pg16
```

(PGroongaも使いたい場合は `groonga/pgroonga` イメージ等に読み替えてください。未対応環境でも `pnpm db:migrate` はガード付きで完走します。)

Supabase / Neon 等のホスティングPostgresを使う場合は、その接続文字列を後述の `DATABASE_URL` に設定してください。

### 3. 環境変数

```sh
cp .env.example .env
```

`.env` を編集し、以下を必ず設定してください:

| 変数 | 説明 |
|---|---|
| `DATABASE_URL` | Postgres接続文字列 |
| `ANTHROPIC_API_KEY` | 分類・記事生成に使用(Claude) |
| `OPENAI_API_KEY` | embedding生成に使用 |
| `BETTER_AUTH_SECRET` | 認証セッションの署名鍵。ランダムな文字列(`openssl rand -base64 32` 等)を設定 |
| `STRIPE_SECRET_KEY` | Stripeダッシュボード([dashboard.stripe.com](https://dashboard.stripe.com/apikeys))から取得するシークレットキー |
| `STRIPE_WEBHOOK_SECRET` | Stripe CLIまたはダッシュボードのWebhookエンドポイント設定から取得(後述) |
| `STRIPE_PRICE_ID` | 月額プランの価格ID。**未取得の場合は後述の `pnpm stripe:setup` で自動作成できます** |
| `ADMIN_EMAILS` | 収集先候補・タグ候補の承認画面(`/admin`)へのアクセスを許可するメールアドレス(カンマ区切り)。未設定の場合`/admin`は誰からもアクセスできません |
| `RESEND_API_KEY` | メールダイジェスト配信に使用。[resend.com](https://resend.com)のダッシュボードで取得(要ユーザー登録)。未設定でも`DIGEST_ENABLED=false`(デフォルト)のままなら他機能に影響しません |
| `RESEND_FROM_EMAIL` | ダイジェストの送信元アドレス。Resend側で送信元ドメインの認証(SPF/DKIM)が必要です |

`CLASSIFY_MODEL` / `GENERATE_MODEL` / `EMBEDDING_MODEL` / `IMPORTANCE_THRESHOLD` / `MAX_GENERATE_PER_RUN` / `NEXT_PUBLIC_APP_URL` / `TRIAL_PERIOD_DAYS` 等はデフォルト値のままで動作します(調整用に上書き可能)。

> Next.js自身は `apps/web/.env` しか自動で読まないため、`apps/web/next.config.ts` でリポジトリルートの `.env` を明示的に読み込むようにしています。単一の `.env` を編集すれば `apps/api` / `packages/db` / `apps/web` すべてに反映されます。

### 4. DBマイグレーション+シード

```sh
pnpm db:migrate
pnpm db:seed
```

`sources` に検証済みの収集先(RSS/Atom 15件、Bluesky公式アカウント10件、Hacker News経由の信頼済みドメイン発見1件、計26件)、`topics` に18トピックが投入されます。あわせて、認証用テーブル(`user`/`session`/`account`/`verification`、better-auth標準スキーマ)と `subscriptions` / `user_topics` テーブルも作成されます。

### 5. Stripe のセットアップ(要ユーザー操作)

以下は**あなた自身で行う必要があります**(Stripeアカウントの作成・APIキー取得はこちらでは代行できません):

1. [Stripeダッシュボード](https://dashboard.stripe.com/register)でアカウントを作成し、テストモードのシークレットキー(`sk_test_...`)を取得 → `.env` の `STRIPE_SECRET_KEY` に設定
2. 月額プランの商品・価格を作成:
   ```sh
   pnpm stripe:setup
   ```
   これがStripe上に「tech-ai-news スタンダードプラン」(月額980円)を自動作成し、生成された `STRIPE_PRICE_ID` を表示します。表示された値を `.env` に設定してください。(ダッシュボードから手動作成しても構いません)
3. Webhookのシークレットを取得。ローカル開発では [Stripe CLI](https://docs.stripe.com/stripe-cli) が簡単です:
   ```sh
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
   表示される `whsec_...` を `.env` の `STRIPE_WEBHOOK_SECRET` に設定してください。本番環境ではダッシュボードの Webhooks 設定画面でエンドポイント(`https://your-domain/api/stripe/webhook`)を登録し、そこで発行されるシークレットを使用します。

### 6. Resend のセットアップ(要ユーザー操作・メールダイジェストを使う場合のみ)

メールダイジェスト配信(下記)を使わない場合はスキップして構いません(`DIGEST_ENABLED=false`のままなら他機能に影響しません)。

1. [Resend](https://resend.com)でアカウントを作成し、APIキー(`re_...`)を取得 → `.env` の `RESEND_API_KEY` に設定
2. 送信元に使うドメインをResendダッシュボードで追加し、指示されたSPF/DKIMのDNSレコードを設定(ドメイン認証が完了しないと送信できません)
3. 認証したドメインのアドレスを `.env` の `RESEND_FROM_EMAIL` に設定(例: `digest@yourdomain.example`)

## パイプラインの実行

```sh
pnpm collect    # RSS/Atomを収集して raw_items へ保存
pnpm classify   # LLMで重要度スコアリング・トピック分類
pnpm generate   # 閾値以上のアイテムを日本語記事として生成し articles へ保存
pnpm digest     # メールダイジェスト配信済みユーザーへ新着記事を送信(要Resend設定)

# collect→classify→generateをまとめて実行:
pnpm pipeline
```

初回は `collect` → `classify` → `generate` の順に実行してください。`generate` はAnthropic/OpenAIのAPI呼び出しが発生します(コストは `docs/spec.md` §7を参照)。

### 収集先の内訳

| 種別(`sources.kind`) | 件数 | 収集方法 |
|---|---|---|
| `rss` / `atom` | 12件 | 公式ブログ・ニュースのRSS/Atomフィード(Anthropicのみ公式RSSが無いためコミュニティ生成フィードで代替) |
| `github_releases` | 4件 | `github.com/{owner}/{repo}/releases.atom`(認証不要) |
| `bluesky` | 10件 | Bluesky公開API(認証不要)。運用実績のある公式アカウントのみ採用(2026-07-06確認済み) |
| `hn_domain` | 1件 | Hacker News (Algolia Search API) 経由で、上記の信頼済み公式ドメインにリンクする記事のみを発見する。任意のドメインは拾わない(法務ガードレール、`docs/spec.md` §9) |

収集先を増やす場合はコード変更不要で、`packages/db/seeds/seed.sql` に行を追加して `pnpm db:seed` するだけです(RSS/Atom/GitHub Releases/Bluesky/HN信頼済みドメインいずれも対応済み)。HN経由で発見してよいドメインの許可リストはDBの `trusted_domains` テーブルで管理しています(初期値は`0007_discovery.sql`でシード)。

### 収集先・タグ候補の自動発見と承認

`collect`(HNスキャン)と`classify`(LLM分類)は、既存の収集先・トピックでは拾えない新しい情報源やテーマを検出すると、それを**候補として保存するだけ**で、承認されるまで収集・記事化には一切使いません(法務ガードレール、`docs/spec.md` §9)。

- **収集先候補**: HN経由で信頼済みドメイン以外のリンクが見つかると、明示的な除外リスト(`apps/api/src/lib/domainDenylist.ts`。報道メディア等の一次情報でないサイトを含む)でフィルタした上で`source_candidates`に記録し、フィード自動検出(`apps/api/src/lib/feedDiscovery.ts`)を試みます。
- **タグ候補**: 分類LLMが既存のどのトピックスラッグにも合わないと判断した場合、新規トピックを`topic_candidates`に提案します。

いずれも `/admin`(`ADMIN_EMAILS`で許可したメールアドレスのみアクセス可)の承認画面で人間が確認し、承認すると初めて`trusted_domains`/`sources`または`topics`に反映されます。却下した候補は再提案されません。

### 自動実行(Cronの代替)

現状 Cloudflare Workers 等への実デプロイは未着手のため、`apps/api` プロセス自身が一定間隔で `collect → classify → generate` を自動実行するスケジューラを内蔵しています(`apps/api/src/scheduler.ts`)。

```sh
# .env で以下を設定してから pnpm dev:api (または本番プロセス) を起動する
SCHEDULER_ENABLED=true
COLLECT_INTERVAL_MINUTES=30
```

- デフォルトは無効です(`SCHEDULER_ENABLED=false`)。誤って有効化したままローカル開発を続けるとLLM API課金が定期的に発生するため、明示的にオプトインする設計にしています。
- `apps/api` プロセスが起動し続けている間だけ機能します(サーバーレス環境では動きません)。継続稼働できるホスティング(VM、Railway、Fly.io等)であればこのままで十分です。
- サーバーレス/Cloudflare Workers Cron Triggersへの移行は次フェーズ(下記)。`apps/api/src/app.ts` はNode APIに依存しない設計にしてあるため、移行時は`export default app`をCloudflare Workersのエントリポイントに差し替えるだけで済む想定ですが、`postgres`(postgres.js)がWorkersランタイムでそのまま動くかは未検証です(Hyperdrive等の追加検証が必要)。

### メールダイジェスト配信

トピック購読済みユーザーへ、新着記事をメールで通知します(`apps/api/src/jobs/digest.ts`、Resend+react-email)。

- `SCHEDULER_ENABLED=true` に加えて `DIGEST_ENABLED=true` を設定した場合のみ、スケジューラが1日1回(`DIGEST_HOUR_JST`、デフォルト7時JST)送信します。二重の明示的opt-inにしているのは、実際のユーザーへメールが飛ぶという性質上、LLM課金以上に慎重を要するためです。
- 送信対象は「アカウント画面でメール配信をON」にしたユーザーのみ(サインアップ時のチェックボックス、またはアカウント画面から後で設定可能)。特定電子メール法対応として、同意日時(`email_preferences.consent_at`)を記録し、メール本文には配信停止リンク(ログイン不要のトークン方式、`/unsubscribe?token=...`)を必ず含めています。
- 各ユーザーの興味トピックに合致する新着記事のみを抜粋(トピック未選択の場合は全件)。本文は要約のみで、全文を読むには記事ページ(ペイウォールあり)への遷移が必要です。
- バウンス・苦情による配信停止リスト(`suppressions`テーブル)は現状Resendのwebhook連携が未実装のため、`/unsubscribe`経由の自主停止のみ反映されます(次フェーズで対応予定)。

## API / Web の起動

```sh
pnpm dev:api   # http://localhost:8787  (ジョブをHTTP経由でも実行可能)
pnpm dev:web   # http://localhost:3000  (記事閲覧・認証・課金)
```

- 記事詳細ページには原文リンクと出典が必ず表示されます(法務ガードレール、`docs/spec.md` §9)。**有料会員(サブスクがtrialing/active)のみ本文全文を閲覧でき、それ以外は要約までのペイウォール表示になります。**要約自体は非会員でも公開しているのは、SEO資産化のための意図的な設計です(`docs/spec.md` §13-4)。
- `/signup` → `/pricing` → 「登録する」でStripe Checkoutへ遷移し、決済完了後 `/account` に戻ります(webhookでサブスク状態が反映されます)。
- `/account` でプラン状況の確認・Stripe Customer Portalへのリンク・興味トピックの選択・メールダイジェストのON/OFFができます。
- `/sitemap.xml` / `/robots.txt` を自動生成しており、公開記事が検索エンジンにインデックスされます。記事ページには`generateMetadata`でtitle/description/OGタグを設定しています。

## 型チェック

```sh
pnpm typecheck
```

## 次フェーズ(未実装)

- Resend webhookによるバウンス/苦情の自動検知→`suppressions`への反映(現状は`/unsubscribe`経由の自主停止のみ)
- 記事ページのOG画像を動的生成(`next/og`等)。現状はテキストのOG/Twitterカードのみ
- 年額プラン等、価格・プランの多様化(`docs/spec.md` §13-2は980円/月の単一プランのまま未決)
- Cloudflare Workers等サーバーレス環境への実デプロイ・Cron Triggers/Queues/Workflowsへの移行(現状は`apps/api`常駐プロセス内蔵のスケジューラで代替)
- Batch APIによるLLMコスト最適化
- `apps/api` のジョブエンドポイント(`/jobs/*`)は現状無認証です。公開デプロイ時はネットワーク制限またはトークン認証を追加してください
- HN経由の本文取得(`apps/api/src/lib/pageContent.ts`)は簡易的なHTMLタグ除去のみで、robots.txtの確認もしていません。収集先ドメインは信頼済みリストに限定していますが、将来的にはより丁寧な本文抽出が望ましいです
- スマホアプリ(将来検討。現時点ではWebのみ)

詳細は [`docs/spec.md`](./docs/spec.md) §11(MVPロードマップ)を参照してください。
