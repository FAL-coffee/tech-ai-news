# docs

tech-ai-news(テック/AI一次情報のAI記事化×トピック購読×メール配信SaaS)の企画・調査ドキュメント。

- [spec.md](./spec.md) — **推奨仕様書 v0.1**(アーキテクチャ、コスト試算、法務ガードレール、DBスキーマ、MVPスコープ)
- research/ — 2026-07-05 実施の調査レポート(料金・法務の重要ファクトは一次情報で裏取り済み。各ファイル冒頭の `# digest` が要約、`# verified_facts` が裏取り結果)
  - [01-competitors.md](./research/01-competitors.md) — 類似サービス・競合分析(海外/日本)と価格相場
  - [02-sources-and-legal.md](./research/02-sources-and-legal.md) — 情報源(RSS/X API/Bluesky等)の取得手段と著作権・規約リスク
  - [03-llm-cost.md](./research/03-llm-cost.md) — LLM API料金比較と月額試算
  - [04-email.md](./research/04-email.md) — メール配信基盤の比較と法令対応
  - [05-infra.md](./research/05-infra.md) — ホスティング/DB/ジョブ基盤の比較
  - [06-billing-auth-mobile.md](./research/06-billing-auth-mobile.md) — 課金・認証・将来のモバイル展開
