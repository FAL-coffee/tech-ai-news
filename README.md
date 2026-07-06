# tech-ai-news

テック/AI一次情報(公式ブログ・GitHub Releases等)を収集し、AIで日本語・英語の記事を生成して配信するサービス。

現在は **Phase 1: 収集→分類→生成パイプライン + 閲覧専用Web** のみを実装しています。認証・課金・メール配信・実デプロイ設定は次フェーズです。詳細な仕様・調査は [`docs/spec.md`](./docs/spec.md) を参照してください。

## 構成

```
apps/
  api/    Hono製API。収集・分類・生成の3ジョブを実行(HTTP経由 or CLIスクリプト)
  web/    Next.js製の閲覧専用Web(認証なし、日英切替)
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

`CLASSIFY_MODEL` / `GENERATE_MODEL` / `EMBEDDING_MODEL` / `IMPORTANCE_THRESHOLD` / `MAX_GENERATE_PER_RUN` 等はデフォルト値のままで動作します(コスト調整用に上書き可能)。

### 4. DBマイグレーション+シード

```sh
pnpm db:migrate
pnpm db:seed
```

`sources` に検証済み15フィード、`topics` に18トピックが投入されます。

## パイプラインの実行

```sh
pnpm collect    # RSS/Atomを収集して raw_items へ保存
pnpm classify   # LLMで重要度スコアリング・トピック分類
pnpm generate   # 閾値以上のアイテムを日英記事として生成し articles へ保存

# まとめて実行:
pnpm pipeline
```

初回は `collect` → `classify` → `generate` の順に実行してください。`generate` はAnthropic/OpenAIのAPI呼び出しが発生します(コストは `docs/spec.md` §7を参照)。

## API / Web の起動

```sh
pnpm dev:api   # http://localhost:8787  (ジョブをHTTP経由でも実行可能)
pnpm dev:web   # http://localhost:3000  (記事一覧・詳細)
```

`apps/web` は `?lang=en` で英語表示に切り替わります。記事詳細ページには原文リンクと出典が必ず表示されます(法務ガードレール、`docs/spec.md` §9)。

## 型チェック

```sh
pnpm typecheck
```

## 次フェーズ(未実装)

- ユーザー認証(Supabase Auth / better-auth)
- Stripe課金・トライアル
- Resendによるメールダイジェスト配信
- Cloudflare Workersへの実デプロイ・Cron/Queues/Workflows配線
- Batch APIによるLLMコスト最適化

詳細は [`docs/spec.md`](./docs/spec.md) §11(MVPロードマップ)を参照してください。
