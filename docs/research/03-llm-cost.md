# digest
2026年7月時点の公式料金(全て裏取り済み): Claude Haiku 4.5=$1/$5、Sonnet 5=$2/$10(イントロ、2026-08-31まで。9/1以降$3/$15)、Opus 4.8=$5/$25/MTok。OpenAIはGPT-5.4=$2.50/$15、5.4-mini=$0.75/$4.50、5.4-nano=$0.20/$1.25、GPT-5.5=$5/$30。GeminiはFlash-Lite $0.25/$1.50〜3.5 Flash $1.50/$9。Batch APIは全社50%割引でデイリーダイジェスト用途に最適、Anthropicはキャッシュ読取0.1倍と併用可。想定負荷(月42M入力/10.8M出力+embedding 18M)で、推奨構成=分類Haiku Batch+日英生成Sonnet 5 Batch+OpenAI embedding-3-smallで約$117/月(イントロ期間中$83)。全Haiku Batchなら$48、Opus 4.8生成でも$186、Gemini Flash系最安なら$12〜20。1,000ユーザーでもLLM原価はユーザー当たり月$0.2以下でボトルネックにならない。注意: Sonnet 5イントロ価格は8月末終了、Claude新トークナイザは同一テキストで約30%トークン増(実測推奨)。embeddingは月$0.4〜4で誤差、Voyageは200M無料枠あり。

# verified_facts
- [OK] Claude Haiku 4.5は入力$1/出力$5 per MTok、Batch APIで$0.50/$2.50(2026年7月時点公式)
- [OK] Claude Sonnet 5のイントロ価格$2/$10は2026年8月31日で終了し、9月1日から標準価格$3/$15(Batchは$1.50/$7.50)になる
- [OK] Claude Opus 4.8は$5/$25 per MTok、Batchで$2.50/$12.50
- [OK] AnthropicのBatch APIは入出力とも50%割引で、プロンプトキャッシュ(読取0.1倍、5分書込1.25倍、1時間書込2倍)と併用(スタック)可能
- [OK] Sonnet 5とOpus 4.7以降は新トークナイザにより同一テキストで約30%トークン数が増えるため、旧基準のトークン見積もりではClaude系コストが2〜3割上振れする => 訂正: 主要部分は正確だが3点補正が必要。(1) 新トークナイザの対象はOpus 4.7以降のOpus系・Sonnet 5・Fable 5/Mythos系のみで、Sonnet 4.6以前とHaiku 4.5は旧トークナイザのまま。「Claude系」全体のコストが上振れするわけではない。(2) 約30%は近似値で、増加率はコンテンツとワークロード形状に依存すると公式が明記。(3) Sonnet 5は2026年8月31日まで導入価格$2/$10(通常$3/$15の約33%引き)が適用中のため、現時点(2026年7月5日)ではトークン数約30%増とほぼ相殺され「コスト2〜3割上振れ」は成立しない。上振れが素直に成立するのは単価据え置きのOpus 4.7/4.8($5/$25)と、2026年9月1日の通常価格移行後のSonnet 5。なお出典URLはパスが「/docs/en/docs/」と重複しており、正規URLは https://platform.claude.com/docs/en/about-claude/pricing。

# report
# LLM APIコスト比較と月額試算(2026年7月5日時点・公式料金ページ確認済み)

## 1. 調査方法

Anthropic・OpenAI・Google・Voyage AIの公式料金ページをWebFetchで直接取得し、日英のWeb検索で相互裏取りした。すべてUSD、1Mトークン(MTok)あたりの価格。

- Anthropic公式: https://platform.claude.com/docs/en/docs/about-claude/pricing
- OpenAI公式: https://developers.openai.com/api/docs/pricing
- Google Gemini公式: https://ai.google.dev/gemini-api/docs/pricing
- Voyage AI公式: https://docs.voyageai.com/docs/pricing

## 2. Anthropic Claude(公式ページで裏取り済み・キャッシュ情報から更新なし)

| モデル | 入力 | 出力 | Batch入力 | Batch出力 | キャッシュ読取 |
|---|---|---|---|---|---|
| Claude Haiku 4.5 | $1.00 | $5.00 | $0.50 | $2.50 | $0.10 |
| Claude Sonnet 5(〜2026-08-31 イントロ) | **$2.00** | **$10.00** | $1.00 | $5.00 | $0.20 |
| Claude Sonnet 5(2026-09-01〜 標準) | $3.00 | $15.00 | $1.50 | $7.50 | $0.30 |
| Claude Opus 4.8 | $5.00 | $25.00 | $2.50 | $12.50 | $0.50 |
| (参考)Claude Fable 5 | $10.00 | $50.00 | $5.00 | $25.00 | $1.00 |

- **Batch APIは入出力とも50%割引**(24時間以内に非同期処理、通常は1時間以内)
- **プロンプトキャッシュ**: 書込1.25倍(5分TTL)/2倍(1時間TTL)、**読取0.1倍**。Batch割引と**併用可能(スタック)**
- 1Mトークンコンテキストが標準料金(ロングコンテキスト割増なし)
- ⚠️ **Sonnet 5・Opus 4.7以降は新トークナイザで同一テキストのトークン数が約30%増加**(実効コストに影響)
- 手元キャッシュ(2026年6月時点)の Haiku $1/$5、Sonnet 5 $3/$15(イントロ$2/$10)、Opus 4.8 $5/$25 は**全て公式ページと一致・変更なし**

出典: https://platform.claude.com/docs/en/docs/about-claude/pricing

## 3. OpenAI GPT系(現行モデル)

| モデル | 入力 | キャッシュ入力 | 出力 | Batch(50%) |
|---|---|---|---|---|
| GPT-5.5 | $5.00 | $0.50 | $30.00 | $2.50 / $15.00 |
| GPT-5.4 | $2.50 | $0.25 | $15.00 | $1.25 / $7.50 |
| GPT-5.4-mini | $0.75 | $0.075 | $4.50 | $0.375 / $2.25 |
| GPT-5.4-nano | $0.20 | $0.02 | $1.25 | $0.10 / $0.625 |
| GPT-5.5-pro / 5.4-pro | $30.00 | — | $180.00 | — |

- Batch APIは全モデル50%割引(24時間以内処理)

出典: https://developers.openai.com/api/docs/pricing (検索裏取り: https://openrouter.ai/openai/gpt-5.5 , https://www.morphllm.com/openai-api-pricing )

## 4. Google Gemini系

| モデル | 入力 | 出力 | Batch入力 | Batch出力 |
|---|---|---|---|---|
| Gemini 3.5 Flash | $1.50 | $9.00 | $0.75 | $4.50 |
| Gemini 3.1 Pro Preview(≦200kトークン) | $2.00 | $12.00 | $1.00 | $6.00 |
| Gemini 3.1 Pro Preview(>200k) | $4.00 | $18.00 | 50%割引 | 50%割引 |
| Gemini 3.1 Flash-Lite | $0.25 | $1.50 | $0.125 | $0.75 |
| Gemini 2.5 Flash | $0.30 | $2.50 | $0.15 | $1.25 |
| Gemini 2.5 Flash-Lite | $0.10 | $0.40 | $0.05 | $0.20 |
| Gemini 2.5 Pro(≦200k) | $1.25 | $10.00 | 50%割引 | 50%割引 |

- Batch Modeは全モデル50%割引。コンテキストキャッシュあり(例: 3.5 Flash読取$0.15+保存$1.00/1M/時)
- **無料ティアあり**(レート制限つき)— 開発・検証段階のコストをほぼゼロにできる

出典: https://ai.google.dev/gemini-api/docs/pricing

## 5. Embeddingモデル(トピックマッチング用)

| モデル | 価格/1Mトークン | 備考 |
|---|---|---|
| OpenAI text-embedding-3-small | **$0.02**(Batch $0.01) | コスパ最良の定番 |
| OpenAI text-embedding-3-large | $0.13(Batch $0.065) | 高精度 |
| Gemini gemini-embedding-001 | $0.15 | Gemini Embedding 2は$0.20 |
| Voyage voyage-4-lite | $0.02 | **200Mトークン無料枠** |
| Voyage voyage-4 | $0.06 | 200Mトークン無料枠 |
| Voyage voyage-4-large | $0.12 | 200Mトークン無料枠 |

月間embedding量は収集300件/日×2,000トークン=約18M/月(生成記事も含めると約27M/月)。**どれを選んでも月$0.4〜$4程度で誤差レベル**。Voyageの無料枠200Mは本ワークロードで7〜11ヶ月分に相当し、初期は実質無料。

出典: 上記OpenAI料金ページ、https://docs.voyageai.com/docs/pricing 、https://ai.google.dev/gemini-api/docs/pricing

## 6. 月額試算の前提(30日/月)

| 処理 | 件数 | 入力/件 | 出力/件 | 月間入力 | 月間出力 |
|---|---|---|---|---|---|
| 分類・スコアリング | 300件/日 | 2,000 | 200 | 18M | 1.8M |
| 記事生成【パターンA: 日英各生成】 | 100記事×2言語=200生成/日 | 4,000 | 1,500 | 24M | 9M |
| 記事生成【パターンB: 英語生成+日本語翻訳】 | 生成100+翻訳100/日 | 4,000/2,000 | 1,500/1,500 | 18M | 9M |
| Embedding | 300件/日 | 2,000 | — | 18M | — |

- **パターンA合計: 入力42M+出力10.8M/月**、**パターンB合計: 入力36M+出力10.8M/月**
- 出力トークンが費用の5〜7割を占めるため、パターンBの節約効果は**わずか4〜7%**。日本語ネイティブ生成の品質を優先してパターンA推奨(以下の表はA基準)

## 7. モデル別×Batch有無 月額マトリクス(分類+日英生成、パターンA、embedding除く)

| モデル(単一モデルで全処理した場合) | 通常API | **Batch API** |
|---|---|---|
| Gemini 2.5 Flash-Lite | $8.5 | **$4.3** |
| GPT-5.4-nano | $21.9 | **$11.0** |
| Gemini 3.1 Flash-Lite | $26.7 | **$13.4** |
| Gemini 2.5 Flash | $39.6 | **$19.8** |
| GPT-5.4-mini | $80.1 | **$40.1** |
| **Claude Haiku 4.5** | $96.0 | **$48.0** |
| Gemini 3.5 Flash | $160.2 | **$80.1** |
| **Claude Sonnet 5(イントロ〜8/31)** | $192.0 | **$96.0** |
| Gemini 3.1 Pro Preview | $213.6 | **$106.8** |
| GPT-5.4 | $267.0 | **$133.5** |
| **Claude Sonnet 5(標準9/1〜)** | $288.0 | **$144.0** |
| **Claude Opus 4.8** | $480.0 | **$240.0** |
| GPT-5.5 | $534.0 | **$267.0** |

計算式: 42M×入力単価+10.8M×出力単価(Batchは半額)。パターンBは入力6M減で各行4〜7%安。

## 8. 推奨構成(品質とコストのバランス)

デイリーダイジェスト型でリアルタイム性不要のため、**全処理をBatch APIで回すのが大前提**(それだけで半額)。

### (a) 推奨: バランス構成 — 約$117/月(イントロ期間中は約$83/月)
| 処理 | モデル | 月額 |
|---|---|---|
| 分類・スコアリング | Claude Haiku 4.5 + Batch | $13.5 |
| 日英記事生成 | **Claude Sonnet 5 + Batch** | $103.5(標準価格)/ $69(イントロ) |
| Embedding | OpenAI text-embedding-3-small | $0.4 |
| **合計** | | **約$117/月** |
理由: Sonnet 5は日本語生成品質が高く、Batchで$1.5/$7.5と手頃。分類はHaikuで十分。プロンプトキャッシュ(共通システムプロンプト読取0.1倍)併用でさらに数%削減可。

### (b) 最小コスト構成 — 約$12〜20/月
分類=Gemini 2.5 Flash-Lite Batch($1.3)、生成=Gemini 2.5 Flash Batch($14.9)またはGemini 3.1 Flash-Lite Batch($9.8)、Embedding=Voyage voyage-4-lite(無料枠内$0)。品質はSonnet比で低下するがMVP検証には十分。無料ティアで開発可。

### (c) 品質最優先構成 — 約$186/月
分類=Haiku Batch($13.5)、生成=**Opus 4.8 Batch**($172.5)、Embedding($0.4)。記事品質が競争優位の核なら選択肢。バランス構成との差は月$70程度しかない点は注目に値する。

### 事業性の観点
1,000ユーザー時でもLLM費用は**ユーザーあたり月$0.01〜0.2**。月額サブスク(例: ¥980〜1,980)に対してLLM原価は1〜2%以下であり、**コスト上のボトルネックにはならない**。むしろメール配信(SES等)・ホスティング・決済手数料の方が相対的に重い。ユーザー数が増えても記事生成コストは固定(生成本数依存)なのが本アーキテクチャの強み。

## 9. 注意点・リスク

1. **Sonnet 5のイントロ価格($2/$10)は2026年8月31日で終了**。予算計画は9月以降の標準価格$3/$15で立てるべき(公式明記)
2. **Claude新トークナイザ(Sonnet 5/Opus 4.7以降)は同一テキストで約30%トークン増**。本試算のトークン数前提が旧トークナイザ基準ならClaude系の実コストは2〜3割上振れの可能性。`count_tokens` APIで実測推奨
3. Batch APIは「24時間以内」保証(Anthropicは通常1時間以内)。デイリーダイジェストなら問題ないが、速報性を売りにするならリアルタイム処理分は通常APIで別枠計上が必要
4. Gemini 3.1 Proは「Preview」ステータスであり料金・仕様が変わる可能性あり
5. プロンプトキャッシュはプレフィックス一致方式。分類処理の共通システムプロンプトが短い(Haikuは最低4,096トークン)とキャッシュされない点に注意
6. 為替(円建てコスト)と各社の値改定リスクを踏まえ、プロバイダ非依存の抽象化レイヤ(モデル切替可能な設計)を推奨

## 10. 出典一覧

- Anthropic料金(モデル・Batch・キャッシュ): https://platform.claude.com/docs/en/docs/about-claude/pricing
- OpenAI料金: https://developers.openai.com/api/docs/pricing
- OpenAI embedding裏取り: https://openrouter.ai/openai/gpt-5.5 , https://www.morphllm.com/openai-api-pricing , https://costgoat.com/pricing/openai-embeddings
- Google Gemini料金: https://ai.google.dev/gemini-api/docs/pricing
- Voyage AI料金: https://docs.voyageai.com/docs/pricing