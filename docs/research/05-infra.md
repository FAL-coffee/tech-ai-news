# digest
有料サブスクアプリのためVercel Hobby(非商用限定)は使えずPro $20/月が必須になる点が最大の分岐。コスト最優先なら全Cloudflare構成(OpenNextでNext.js+Hono、Workers Paid $5/月に1,000万req・3,000万CPU-ms・Cron 250個・Queues 100万ops・Workflows込み)が圧倒的に安く、WorkflowsはステップのAPI待ち時間が課金されずwall時間無制限のためLLM生成バッチ(1件数分)に最適。DBはSupabase Pro $25/月が第一候補: pgvector(ベクトル検索)+PGroonga(日本語全文検索)+Auth+pg_cron/pgmq同梱で、日英記事のトピックマッチング要件に唯一フルマッチ。Freeは1週間非アクティブで停止するため商用本番には不可。予算最優先ならNeon従量課金($0.106/CU-h+$0.35/GB-月、最低額なし、月$3〜10目安)。推奨: 最小構成=CF Workers Paid $5+Neon従量で月$8〜、機能重視最小=CF $5+Supabase Pro $25で月$30、余裕構成=Vercel Pro $20+CF $5+Supabase Pro $25(+Trigger.dev Hobby $10)で月$50〜60。Vercel一体構成でもProのcron(毎分)+function最大800秒で1日数百件処理は成立するがリトライ/キュー機構は自前。Inngest Pro($99/月)への跳ね上がりとFly.io Managed Postgres($38/月〜)は小規模には不向き。AWSはLambda+EventBridge Schedulerがほぼ無料だが運用負荷が高く部分採用に留めるべき。

# verified_facts
- [OK] Vercel Hobbyプランは公式に非商用・個人利用限定と明記されており、有料サブスクアプリは初日からPro($20/ユーザー/月、$20分の使用量クレジット込み)が必須
- [OK] Vercel FunctionsはHobby最大300秒、Pro最大800秒(拡張1800秒beta)。CronはHobbyが1日1回のみ・精度±59分、Proは毎分実行可・分単位精度・100個/プロジェクト
- [OK] Cloudflare Workers Paidは$5/月で1,000万リクエスト+3,000万CPU-ms込み(超過$0.30/100万req、$0.02/100万CPU-ms)、Cron Triggers 250個/アカウント、Queues 100万ops/月込み
- [OK] Cloudflare WorkflowsはWorkers Paid $5に含まれ、ステップのwall clock時間は無制限でLLM API待ち中のCPU時間は課金されない(step CPUはデフォルト30秒・最大5分)
- [OK] Supabase Proは$25/月でDB 8GB込み(超過$0.125/GB)・MAU 10万・egress 250GB。pgvectorとPGroonga(日本語全文検索)両対応でAuth/Realtime/pg_cron/pgmq同梱。Freeプロジェクトは1週間非アクティブで自動停止

# report
# テック/AIニュース自動収集・要約サービス インフラ調査レポート(2026年7月時点)

Next.jsフロント + Hono(TypeScript)バックエンド + 定期クロール/LLM生成ジョブ、初期〜1000ユーザー・1日数百件処理という前提で、公式料金ページを直接確認した結果をまとめる。

---

## 1. 前提となる重要な制約(先に押さえるべき事実)

- **Vercel Hobby(無料)プランは非商用・個人利用限定**。公式ドキュメントに "the Hobby plan restricts users to non-commercial, personal use only" と明記されており、**初日から有料サブスク課金するアプリはPro($20/ユーザー/月)が必須**。 [出典](https://vercel.com/docs/plans/hobby)
- **AWSは2025年7月15日以降の新規アカウントで無料枠が刷新**され、「最大$200クレジット・最長6ヶ月のFreeプラン」方式に変更。ただしLambda(月100万リクエスト+40万GB秒)等の「Always Free」枠は存続。 [出典](https://aws.amazon.com/blogs/aws/aws-free-tier-update-new-customers-can-get-started-and-explore-aws-with-up-to-200-in-credits/)
- **Fly.ioは新規顧客向け無料枠なし**(2024年10月に廃止)。 [出典](https://fly.io/docs/about/pricing/)
- **PlanetScaleは無料プランなし**(2024年に廃止済み)。現在はPostgres対応があり最安$5/月(PS-5、シングルノード)。 [出典](https://planetscale.com/pricing)

---

## 2. ホスティング比較

### Vercel ([pricing](https://vercel.com/pricing))
| 項目 | Hobby(無料) | Pro($20/ユーザー/月) |
|---|---|---|
| 商用利用 | **不可** | 可 |
| Function呼び出し | 100万/月 | 100万込み、超過$0.60/100万 |
| Active CPU | 4時間/月 | $0.128/時(超過) ※$20分のクレジット込み |
| メモリ | 360GB-hrs/月 | $0.0106/GB-hr(超過) |
| Edge Requests | 100万/月 | 1,000万込み、超過$2/100万 |
| 転送量 | 100GB/月 | 1TB込み、超過$0.15/GB |
| **Function最大実行時間** | **300秒** | **デフォルト300秒、最大800秒、拡張1800秒(beta)** |
| メモリ上限 | 2GB/1vCPU | 4GB/2vCPU |
| **Cron Jobs** | 100個/プロジェクトだが**1日1回のみ・精度±59分** | 100個、**毎分実行可・分単位精度** |

- Fluid computeでは**I/O待ち(LLM API呼び出し等)はActive CPU課金対象外**。LLM要約のような「待ち時間が大半」のワークロードはコスト効率が良い。 [Functions limits](https://vercel.com/docs/functions/limitations) / [Cron pricing](https://vercel.com/docs/cron-jobs/usage-and-pricing)
- 実行時間無制限のワークフローには「Vercel Workflows」が提供されている(Hobbyにも50Kイベント/月の枠あり)。

### Cloudflare Workers ([pricing](https://developers.cloudflare.com/workers/platform/pricing/))
| 項目 | Free | **Paid $5/月** |
|---|---|---|
| リクエスト | 10万/日 | **1,000万/月込み**、超過$0.30/100万 |
| CPU時間 | 10ms/呼び出し | **3,000万CPU-ms/月込み**、超過$0.02/100万ms |
| 実行時間 | — | デフォルト30秒、**CPU最大5分に設定可、Cron起動は最大15分CPU** |
| Cron Triggers | 5個/アカウント | 250個/アカウント([limits](https://developers.cloudflare.com/workers/platform/limits/)) |
| Workerサイズ | 3MB(gzip) | 10MB(gzip) |
| メモリ | 128MB | 128MB |

同梱サービスの無料枠/料金:
- **Queues**: Free 1万ops/日 / Paid 100万ops/月込み・超過$0.40/100万。**Consumerはwall clock最大15分**、バッチ100件、リトライ100回。Freeは保持24時間固定。 [出典](https://developers.cloudflare.com/queues/platform/limits/)
- **Workflows**: Workers料金に含まれる(追加基本料なし)。**ステップのwall時間は無制限**(LLM API待ちはCPU課金されない)、ステップCPUはPaidで30秒(最大5分)、Paidは1万ステップ/実行。**LLMバッチ処理に最適**。 [pricing](https://developers.cloudflare.com/workflows/reference/pricing/) / [limits](https://developers.cloudflare.com/workflows/reference/limits/)
- **D1**(SQLite): Free 500万行読取/日・10万行書込/日・5GB / Paid 250億行読取/月込み
- **KV**: Free 10万読取/日 / **R2**: 10GB無料、egress無料
- **Workers AI**: 1万Neurons/日無料、超過$0.011/1,000 Neurons(例: Llama 3.1 8B $0.045/M入力トークン) [出典](https://developers.cloudflare.com/workers-ai/platform/pricing/)
- **Vectorize**(ベクトルDB): Paidで5,000万クエリ次元/月・1,000万保存次元まで無料枠内。768次元×5万ベクトル・20万クエリ/月で約$1.94/月と激安。 [出典](https://developers.cloudflare.com/vectorize/platform/pricing/)

**HonoはCloudflare Workersがネイティブターゲット**であり、この構成との親和性は最も高い。

### Railway ([docs](https://docs.railway.com/reference/pricing/plans))
- Hobby $5/月($5分の使用量込み)、Pro $20/月($20分込み)
- 単価: **メモリ$10/GB/月、vCPU $20/月、egress $0.05/GB**、ボリューム$0.15/GB/月
- 常駐コンテナ型。0.5GB RAM+0.1vCPU程度の小さなHono+ワーカー常駐なら$5枠内に収まり得るが、serverlessに比べ「常時起動分」が課金される。

### Fly.io ([pricing](https://fly.io/docs/about/pricing/))
- 無料枠なし。最小VM(shared-cpu-1x 256MB)約**$2.02/月**(IAD)。帯域 北米/欧州$0.02/GB(アジアは$0.04/GB)
- **Managed Postgres Basicが$38/月+ストレージ$0.28/GB**と小規模には割高。 [出典](https://fly.io/docs/mpg/)
- 東京リージョンあり・安価なVMは魅力だが、DBまで含めると小規模ではコスト優位性が薄い。

### Render ([pricing](https://render.com/pricing))
- Free: 750インスタンス時間/月、**15分アイドルでスピンダウン**(復帰約1分)。無料Postgresは1GB・**30日で失効**
- 有料: Starter **$7/月**(512MB/0.5vCPU、常駐)、Postgres $7/月〜、**Cron Jobsは最低$1/月**(実行秒課金)
- シンプルだがサービス単位課金が積み上がりやすい。

### AWS(Lambda + EventBridge)
- Lambda: **月100万リクエスト+40万GB秒がAlways Free**、超過$0.20/100万リクエスト、$0.0000166667/GB秒(x86)。最大実行15分。 [出典](https://aws.amazon.com/lambda/pricing/)
- **EventBridge Scheduler: 月1,400万回の起動まで無料**、超過$1.00/100万。 [出典](https://aws.amazon.com/eventbridge/pricing/)
- 純粋なコンピュート費はほぼ$0にできるが、Next.jsホスティング(CloudFront/S3またはAmplify等)・NAT・RDSなどを含めると構成が複雑化し、個人〜小規模チームの運用負荷が最も高い。ジョブ実行基盤としてのLambda+Schedulerは実質無料で強力。

---

## 3. データベース比較

### Supabase ([pricing](https://supabase.com/pricing)) — 本用途の最有力
- **Free**: $0、DB 500MB、egress 5GB、MAU 5万、**1週間非アクティブで自動一時停止**(最大2プロジェクト)→ 商用本番には不適
- **Pro: $25/月**: DB 8GB込み(超過$0.125/GB)、egress 250GB、MAU 10万、ストレージ100GB、Edge Functions 200万回
- **pgvector対応** + **PGroonga対応(日本語の形態素/N-gram全文検索)**。日英両方の記事を全文検索+ベクトル検索する本アプリの要件に唯一フルマッチ。 [pgvector](https://supabase.com/docs/guides/database/extensions/pgvector) / [PGroonga](https://supabase.com/docs/guides/database/extensions/pgroonga)
- **Auth・Realtime・Storage・Cron(pg_cron)・Queues(pgmq)を同梱**しており、サブスク認証やDB内ジョブスケジュール/軽量キューまで1サービスで賄える。 [Supabase Cron](https://supabase.com/modules/cron)
- Edge Functionsの実行時間はFree 150秒/有料400秒(CPU 2秒)なので、LLM長時間バッチの実行場所には不向き(ジョブは外部で実行しDBだけ使うのが吉)。 [出典](https://supabase.com/docs/guides/functions/limits)

### Neon ([pricing](https://neon.com/pricing))
- 2025年に純従量課金へ移行(Databricks買収後)。**Launchプラン: 月額最低なし、$0.106/CU-hour + ストレージ$0.35/GB-月**、転送500GB込み。Freeは100 CU-h/月・0.5GB。 [新料金解説](https://neon.com/blog/new-usage-based-pricing)
- Scale to zeroにより低トラフィック時のコストが数ドル/月に収まる。pgvector対応。Auth等は同梱されないため、認証・メール等は別途。「Postgresだけ安く欲しい」場合の最安クラス。

### Turso ([pricing](https://turso.tech/pricing))
- Free: DB 100個・5GB・5億行読取/月。Developer $4.99/月、Scaler $24.92/月
- libSQL(SQLite)。エッジ読み取りは速いが、**pgvector/PGroongaのようなPostgres拡張は使えず**、日本語全文検索・ベクトル検索要件では工夫が必要。本用途では優先度低。

### PlanetScale ([pricing](https://planetscale.com/pricing))
- 無料なし。Postgres対応: PS-5(シングルノード)$5/月、HA構成はPS-10で$30/月〜。品質は高いがHA前提の価格設計で、小規模スタートにはSupabase/Neonが先。

**トピックマッチング適性の結論**: 「日本語+英語の全文検索(PGroonga)」「埋め込みベクトルでの類似度マッチング(pgvector)」「Auth同梱」を1つで満たすSupabaseが第一候補。コスト最優先ならNeon従量+pgvector(全文検索は英語中心ならPostgres標準FTS、日本語はpg_bigm等の可用性を要確認)。

---

## 4. 長時間ジョブ/キュー基盤(LLM生成: 1バッチ数分)

| サービス | 無料枠 | 有料 | 適性 |
|---|---|---|---|
| **Cloudflare Workflows** | Workers Freeに含む(CPU 10ms/stepで実質不可) | **Workers Paid $5に含まれる**。step CPU最大5分・**wall時間無制限**(API待ち課金なし) | LLM待ちが大半のジョブに最適。durable execution・自動リトライ内蔵 |
| **Cloudflare Queues** | 1万ops/日 | $5プランで100万ops/月込み、超過$0.40/100万。Consumer wall 15分 | クロール→生成のファンアウトに好適 |
| **Inngest** ([pricing](https://www.inngest.com/pricing)) | 5万run/月・並列5 | Pro **$99/月**〜(100万run) | DXは良いがProへの跳ね上がりが大きい。無料枠内なら優秀 |
| **Trigger.dev** ([pricing](https://trigger.dev/pricing)) | $5クレジット/月・並列20 | Hobby **$10/月**、Pro $50/月。**タスク実行時間無制限**、$0.25/1万run+マシン秒課金(例: 10秒タスク×100回/日≒$1.09/月) | 長時間LLMジョブに好適。$10で十分回る |
| **Upstash QStash** ([pricing](https://upstash.com/pricing/qstash)) | 1,000msg/日・スケジュール10個 | 従量 **$1/10万msg** | serverless間のHTTPキュー/スケジューラとして最安。実行自体は自前のfunctionで行う |

**Vercel cron+functionで足りるか**: Proなら「毎分cron+最大800秒(≒13分)/拡張1800秒」なので、**1日数百件・1バッチ数分の要約生成は十分足りる**。ただしHobbyは「1日1回・±59分・300秒」なので定期巡回サービスとしては不足。リトライ・分散・可観測性を考えるとQueues/Workflowsか軽量ジョブサービス併用が安全。

---

## 5. アーキテクチャ3案の比較

### 案A: Next.js(Vercel Pro) + Hono(Cloudflare Workers Paid) 分離構成 — 約$25/月〜
- フロント/ISRはVercelの得意領域、クロール/生成ジョブはCFのCron Triggers+Queues+Workflowsで堅牢に。HonoはCFネイティブ。
- 欠点: 2プラットフォーム運用、認証・環境変数・デプロイが二重化。CORSや内部認証の設計が必要。

### 案B: Next.js API Routes に Hono を載せる一体構成(Vercel Proのみ) — 約$20/月〜
- Honoは`hono/vercel`アダプターでVercelにゼロコンフィグデプロイ可能([Hono docs](https://hono.dev/docs/getting-started/vercel))。cronはVercel Cron(毎分・800秒)で完結。
- Fluid computeでLLM待ちはActive CPU非課金のため、生成ジョブのコストも小さい。**運用が最もシンプル**で、小規模チームの初手として合理的。
- 欠点: 800秒超のジョブは分割かVercel Workflows頼み。ベンダーロックイン。Vercelの従量超過(特に画像・転送)は監視要。

### 案C: 全部Cloudflare(OpenNext + Workers) — 約$5/月〜
- `@opennextjs/cloudflare`はNext.js 15/16対応でSSR/ISR/PPR/App Router対応([OpenNext](https://opennext.js.org/cloudflare))。Worker 10MB(gzip)制限・一部Node API非互換に注意。
- Workers Paid $5でホスティング+cron+Queues+Workflows+D1/KV/R2/Vectorizeまで全部入り。**圧倒的最安**。
- 欠点: Next.js新機能への追従はVercel本家より遅れる。ビルド/デバッグの手間が増える。メモリ128MB制限。

---

## 6. 推奨構成と月額コスト(LLM API費・メール配信費は別)

### 最小構成(月額 約$10〜30、推奨は案C+Supabase Pro)
- **Cloudflare Workers Paid $5**(OpenNextでNext.js+Hono+Cron+Queues+Workflows)
- DB: 予算最優先なら **Neon従量(月$3〜10目安)**、機能優先なら **Supabase Pro $25**(pgvector+PGroonga+Auth)
- 合計: **$8〜30/月**。1日数百件の処理(約1万〜3万ジョブ/月)はWorkers Paidの3,000万CPU-ms/Queues 100万opsに対し余裕
- 注: Supabase Freeは1週間非アクティブで停止するため、有料アプリの本番DBには使わない

### 余裕構成(月額 約$55〜70)
- **Vercel Pro $20**(Next.jsフロント、cronバックアップ)
- **Cloudflare Workers Paid $5**(Hono API+クロール/生成ジョブ: Cron→Queues→Workflows)
- **Supabase Pro $25**(Postgres+pgvector+PGroonga+Auth+pg_cron/pgmq)
- ジョブ可観測性が欲しければ **Trigger.dev Hobby $10** を追加(実行時間無制限)
- 合計: **$50〜60/月**。フロントのDX・ジョブの信頼性・DB機能をすべて確保しつつ1000ユーザー規模まで増設不要

### 選ばない方がよいもの(この規模・要件では)
- Fly.io Managed Postgres($38/月〜)・PlanetScale HA($30/月〜): 小規模には過剰
- Inngest Pro($99/月): 無料枠を超えた瞬間のコストジャンプが大きい
- AWSフルスタック: Lambda+EventBridge自体はほぼ無料だが、全体の構築・運用コストが個人規模に見合わない(ジョブ基盤のみの部分採用は可)

---

## 主要出典
- Vercel: https://vercel.com/pricing / https://vercel.com/docs/functions/limitations / https://vercel.com/docs/cron-jobs/usage-and-pricing / https://vercel.com/docs/plans/hobby
- Cloudflare: https://developers.cloudflare.com/workers/platform/pricing/ / https://developers.cloudflare.com/workflows/reference/limits/ / https://developers.cloudflare.com/queues/platform/limits/ / https://developers.cloudflare.com/workers-ai/platform/pricing/ / https://developers.cloudflare.com/vectorize/platform/pricing/
- DB: https://supabase.com/pricing / https://neon.com/pricing / https://turso.tech/pricing / https://planetscale.com/pricing
- ジョブ: https://www.inngest.com/pricing / https://trigger.dev/pricing / https://upstash.com/pricing/qstash
- その他: https://docs.railway.com/reference/pricing/plans / https://fly.io/docs/about/pricing/ / https://render.com/pricing / https://aws.amazon.com/lambda/pricing/ / https://aws.amazon.com/eventbridge/pricing/ / https://opennext.js.org/cloudflare / https://hono.dev/docs/getting-started/vercel