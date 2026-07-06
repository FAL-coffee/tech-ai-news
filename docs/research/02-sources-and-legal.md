# digest
収集基盤は公式RSS/Atomが主軸で足りる: Vercel(/atom)、Next.js(feed.xml)、OpenAI(news/rss.xml)、GitHub Blog/Changelog、AWS、Cloudflare、Deno、Bun、TypeScriptは提供確認済み(無料)。GitHub Releasesは{repo}/releases.atomが認証不要。例外はAnthropic(RSSなし→コミュニティfeed/メールパース)とReact(不安定)。X APIは2026年2月にFree廃止・pay-per-use化(読取$0.005/post、投稿$0.015、URL付き$0.20)で月数十〜数百ドル、かつ規約で再配布・AI学習利用禁止のためコア依存は不可。Blueskyは無料・審査なしで有力代替。HN Algolia APIは無料、Redditは事前承認制+$0.24/1kコール、Product Hunt商用は要承諾。法的には、収集・解析は著作権法30条の4で原則適法(robots.txt回避はただし書リスク)だが、出力段階で元記事の創作的表現が残る要約・翻訳は翻案・公衆送信権侵害となり、47条の5の軽微利用も「原文の代替になる要約」は対象外。事実(リリース情報)を自分の言葉で記事化するのは適法だが、報道記事の網羅的要約配信は読売(21.7億円)・朝日日経(44億円)対Perplexity訴訟の争点そのものであり回避すべき。全記事に原文リンク+出典明示、引用は32条要件遵守が必須。

# verified_facts
- [OK] X APIは2026年2月6日にティア制を廃止しpay-per-use化(新規Freeティア廃止)。公式単価はpost読取$0.005/件、post作成$0.015/リクエスト(URL付き投稿は$0.20)で、小規模巡回でも月数十〜数百ドルかかる => 訂正: 主張は概ね正確だが2点補足: (1) 2026年2月6日時点では既存契約者のBasic($200/月)/Pro($5,000/月)は存続しており廃止されたのは新規受付。Basicの強制PPU移行は2026年5月頃に別途実施。(2) 2026年4月20日発効の改定で自アプリによる自分のデータの読取(Owned Reads)は$0.001/件に引き下げられ、$0.005/件は他者のpost読取に適用。また24時間(UTC)内の同一リソース重複読取は課金されない。
- [OK] X Developer AgreementはAPI取得コンテンツの第三者への再配布・シンジケーションと基盤モデルのAI学習利用を禁止し、X利用規約は2023年9月から無断スクレイピングを明示的に禁止している => 訂正: 主張の大筋は正しいが1点精緻化が必要。「無断スクレイピングの明示的禁止」は2023年9月に始まったのではなく、遅くとも2017年10月版の利用規約(Version 12)から「scraping the Services without the prior consent ... is expressly prohibited」として存在していた。2023年9月29日発効のVersion 19で新たに変わったのは、(1) それまでrobots.txt準拠なら許可されていた「クローリング」も禁止対象に加えた点、(2) 同意要件を「prior written consent(事前の書面同意)」に強化した点。正確には「X利用規約は2023年9月29日の改定で、robots.txt準拠のクローリング許可を廃止し、事前の書面同意のないクローリング・スクレイピングを形態・目的を問わず明示的に禁止した(スクレイピング自体の明示禁止はそれ以前から存在)」とすべき。
- [OK] Bluesky(AT Protocol)APIは無料・審査不要で、レート制限は読取3,000リクエスト/5分/IP・作成系5,000ポイント/時。Xの現実的な代替となる => 訂正: 2点の軽微な不正確さあり。(1)「読取3,000リクエスト/5分/IP」とあるが、公式ドキュメント上この3,000/5分/IPは読取専用ではなく、PDSへの全APIリクエストに適用される全ルート合算のグローバル制限。(2)作成系5,000ポイント/時は正しいが、加えて35,000ポイント/日の日次上限がある(投稿換算で最大1,666件/時・11,666件/日)。無料・審査不要は正しい。「Xの現実的な代替」は意見だが、X API Basicが月額$200であるのに対し無料である点で開発者向けとしては妥当(ただしユーザー規模はXより大幅に小さい)。
- [NG] 主要ベンダーの公式ブログはVercel(/atom)、Next.js(feed.xml)、OpenAI(news/rss.xml)、GitHub Blog/Changelog、AWS、Cloudflare、Deno、Bun、TypeScriptでRSS/Atom提供を直接確認済み(無料)。AnthropicのみRSSなし、react.devのrss.xmlは404 => 訂正: react.devのrss.xmlは404ではない。https://react.dev/rss.xml は2026-07-05時点でHTTP 200を返し、有効なRSS 2.0フィード「React Blog」(公式Reactチームのブログ、lastBuildDate 2026-07-01)を配信している。過去に404だった可能性はあるが現在は提供されている。その他の主張(Vercel /atom、Next.js feed.xml、OpenAI news/rss.xml、GitHub Blog/Changelog、AWS、Cloudflare、Deno、Bun、TypeScriptのRSS/Atom提供、およびAnthropic公式RSSなし)はすべて正しい。
- [OK] GitHub Releasesは https://github.com/{owner}/{repo}/releases.atom が認証不要で利用でき、REST APIも認証済み5,000リクエスト/時まで無料

# report
# テック/AI情報収集・要約配信サービス調査レポート — 情報源の取得手段と法的リスク(2026年7月5日時点)

## A. 一次情報の取得手段

### A-1. 主要公式ブログのRSS/Atom提供状況(フィードURLを直接フェッチして確認済み)

| ソース | フィードURL | 状況(2026-07-05確認) |
|---|---|---|
| Vercel | `https://vercel.com/atom` | ✅ Atom提供。最終更新2026-07-03を確認 |
| Next.js | `https://nextjs.org/feed.xml` | ✅ RSS提供。最新記事「Turbopack: What's New in Next.js 16.3」を確認 |
| React (react.dev) | `https://react.dev/rss.xml` | ❌ 本日時点で404。過去に提供・URL変遷あり不安定([Issue #6835](https://github.com/reactjs/react.dev/issues/6835))。代替: `facebook/react`のreleases.atom |
| OpenAI | `https://openai.com/news/rss.xml` | ✅ 公式RSS「OpenAI News」提供を確認 |
| Anthropic | なし | ❌ 公式RSSなし([Readless検証 2026-05](https://www.readless.app/blog/best-ai-news-rss-feeds-2026))。コミュニティ生成feed: [taobojlen/anthropic-rss-feed](https://github.com/taobojlen/anthropic-rss-feed/blob/main/anthropic_news_rss.xml)、[Olshansk/rss-feeds](https://github.com/Olshansk/rss-feeds)(毎時スクレイプ生成) |
| Google | `https://blog.google/rss`(全社)、developers.googleblog.com→`feeds.feedburner.com/GDBcode` | △ 検索で確認([出典](https://conoroneill.net/2023/12/12/rss-feed-for-the-google-developer-blog/))。プロダクト別ブログ(Android等)は個別feedあり |
| GitHub Blog | `https://github.blog/feed/` | ✅ 提供確認(WordPress標準) |
| GitHub Changelog | `https://github.blog/changelog/feed/` | ✅ 提供確認。プロダクト更新の一次情報として優秀 |
| AWS | `https://aws.amazon.com/blogs/aws/feed/` | ✅ 「AWS News Blog」提供確認(他ブログも`/blogs/*/feed/`) |
| Cloudflare | `https://blog.cloudflare.com/rss/` | ✅ 提供確認 |
| Deno | `https://deno.com/feed` | ✅ Atom提供確認(最新「Deno 2.9」) |
| Bun | `https://bun.com/rss.xml` | ✅ 提供確認(bun.shから移転) |
| TypeScript | `https://devblogs.microsoft.com/typescript/feed/` | ✅ 提供確認(最新「Announcing TypeScript 7.0 RC」) |

**GitHub Releases**: 任意のリポジトリで `https://github.com/{owner}/{repo}/releases.atom` が**認証不要**で利用可能(vercel/next.jsで動作確認済み)。REST APIは認証済み5,000リクエスト/時・未認証60/時([GitHub Docs](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api))。

**結論**: React(不安定)とAnthropic(なし)を除き、主要ベンダーはほぼ全てRSS/Atomを公式提供。**RSS+GitHub Releases Atomを収集基盤の主軸にすれば取得コストはほぼゼロ**。Anthropicはコミュニティfeed利用か自前の差分クロール(robots.txt遵守)で補完。

### A-2. X(Twitter) API v2 — 2026年現在の料金と現実性

- **2026年2月6日、ティア制(Free/Basic/Pro)を廃止しpay-per-use(前払いクレジット制)へ移行。Freeティアは新規開発者向けに廃止**。既存契約者のBasic($200/月・読取15,000post/月)/Pro($5,000/月・読取100万post/月)はレガシー扱いで、レガシーBasicも2026年6月以降pay-per-useへ移行が進むと報じられている([Postproxy](https://postproxy.dev/blog/x-api-pricing-2026/)、[Roboin](https://roboin.io/article/en/2026/02/08/x-transitions-api-to-pay-per-use-model-ending-free-plan/))。
- **公式料金ページ**([docs.x.com/x-api/getting-started/pricing](https://docs.x.com/x-api/getting-started/pricing))で確認した単価: **post読取 $0.005/件**、ユーザー読取 $0.010/件、**post作成 $0.015/リクエスト(URLを含む投稿は$0.20)**、自分のデータ(Owned Reads)は$0.001/件。24時間UTC窓内の同一リソース重複課金なし(dedupe)。読取は月200万件上限との第三者報告あり([api.sorsa.io](https://api.sorsa.io/blog/twitter-api-pricing-2026))。Enterpriseは約$42,000/月〜([xpoz](https://www.xpoz.ai/blog/guides/understanding-twitter-api-pricing-tiers-and-alternatives/))。
- **現実コスト試算**: 公式アカウント30個を巡回し月1万post読取なら約$50/月、タイムラインAPIが返す件数ベース課金のため実際は数倍膨らみやすい(dedupeは24時間のみで翌日は再課金)。小規模でも**月数十〜数百ドル**を見込むべきで、RSS対比で明確に高コスト。
- **規約上の注意**: X利用規約は2023年9月改定で**同意なきスクレイピングを明示的に禁止**([TechCrunch](https://techcrunch.com/2023/09/08/x-updates-its-terms-to-ban-crawling-and-scraping/))。[X Developer Agreement](https://docs.x.com/developer-terms/agreement)は**Licensed Materialの第三者への販売・再配布・シンジケーションを禁止**、iframe埋め込み禁止、さらに**X APIやデータでの基盤モデル(foundation/frontier model)の学習・fine-tuneを禁止**。→ API経由で取得したポスト本文をDB保存して自サービスで再配信することは規約違反リスクが高い。表示は公式埋め込みウィジェットまたはリンクに留めるべき。

### A-3. 代替手段の現状

- **Bluesky (AT Protocol)**: **API無料・審査なし・APIキー不要**(アカウント作成のみ)。レート制限は5,000ポイント/時・35,000/日(作成系)、読み取りは3,000リクエスト/5分/IP([公式Docs](https://docs.bsky.app/docs/advanced-guides/rate-limits)、[Blotato](https://www.blotato.com/blog/bluesky-api-pricing))。認証不要のpublic APIで読み取り可。難点は主要テック企業アカウントの投稿頻度がXほど高くないこと。
- **Nitter**: 2024年1月のX側API変更で事実上終息。2026年時点で稼働公開インスタンスにRSS提供はほぼ皆無([CarryFeed](https://carryfeed.com/blog/nitter-alternatives-2026)、[HN](https://news.ycombinator.com/item?id=39382590))。実用不可。
- **RSSHub**: セルフホスト+`TWITTER_AUTH_TOKEN`(実アカウントのトークン)でXルートが動くが、2025年以降403エラー・空レスポンスが頻発しアカウントBANリスクとX規約違反リスクあり([Issue #19420](https://github.com/DIYgod/RSSHub/issues/19420))。**恒久基盤にすべきでない**。Anthropic等RSSなしサイトのルートには有用。
- **Mastodon**: プロフィールに標準でRSS(`https://instance/@user.rss`)があり、APIも無料。ただしテック企業公式の活動は限定的。
- **ニュースレターのパース**: Kill the Newsletter等のメール→RSS変換、または自前の受信メールアドレス(SES/Mailgun inbound)でHTMLメールをパースする方式が、RSSなしソース(Anthropic等)の確実な補完手段([Readless](https://www.readless.app/blog/best-ai-news-rss-feeds-2026)もメール捕捉フローを推奨)。
- **Hacker News**: [Algolia HN Search API](https://hn.algolia.com/api)が**無料・認証不要・10,000リクエスト/時/IP**。公式Firebase APIも無料。二次情報だがトレンド検出に最適。
- **Reddit API**: 無料枠は100クエリ/分(OAuth)。商用は**$0.24/1,000コール**、さらに**2025年11月のResponsible Builder Policyで全アプリ事前承認制**に([Data365](https://data365.co/blog/reddit-api-pricing)、[ReplyDaddy](https://replydaddy.com/blog/reddit-api-pre-approval-2025-personal-projects-crackdown))。優先度低。
- **Product Hunt API v2 (GraphQL)**: 非商用は無料だが**商用利用は要個別連絡**(hello@producthunt.com)([公式GitHub](https://github.com/producthunt/producthunt-api))。有料サービスに組み込むなら事前承諾が必要。

## B. 法的リスク(日本法中心)

### B-1. 著作権法30条の4(情報解析)と47条の5(軽微利用)

- **30条の4**: 著作物に表現された思想・感情の「享受」を目的としない利用(情報解析等)は原則適法。**クロールによる記事収集・LLMへの入力(解析)自体は原則ここでカバーされる**。ただし「著作権者の利益を不当に害することとなる場合」(ただし書)は適用外 — 文化庁「考え方」は、情報解析用に販売されるDBの市場と衝突する場合や、**robots.txt等の技術的措置を回避したクロール**をただし書該当例として挙げる([文化庁「AIと著作権に関する考え方について」2024-03-15 PDF](https://www.bunka.go.jp/seisaku/bunkashingikai/chosakuken/pdf/94037901_01.pdf))。
- **47条の5**: 検索・情報解析の結果提供に「**付随して**」「**軽微な**」利用(スニペット表示等)を許容。RAG型の要約提供にも適用の余地があるが、**「既存著作物の創作的表現の提供を主目的とする場合」は対象外**であり、軽微性(量・割合・精度)の限界がある([STORIA法律事務所の解説](https://storialaw.jp/blog/10806)、[文化庁令和6年度著作権セミナー資料](https://www.bunka.go.jp/seisaku/chosakuken/pdf/94097701_02.pdf))。**元記事の代替となるレベルの要約全文配信は47条の5では正当化できない**。

### B-2. LLM要約・翻訳記事の有料配信リスク

- **翻訳・要約は翻案(27条)に当たり得る**。元記事の創作的表現が残った要約・全文翻訳は二次的著作物であり、無許諾での配信は複製権・翻案権・公衆送信権侵害。生成・利用段階の侵害判断は通常どおり「**類似性+依拠性**」で行うというのが文化庁「考え方」の立場。
- 一方、**事実・データそのものは著作権の保護対象外**(著作権法10条2項:「事実の伝達にすぎない雑報及び時事の報道」は著作物に該当しない)。**「Next.js 16.3がリリースされ、機能Xが追加された」という事実を、原文の表現をなぞらず自分の言葉で記事化することは著作権侵害にならない**。リリースノート・changelogの機能列挙も表現の創作性は低く、この類型は本質的に低リスク。
- ただし**著作物性がなくても不法行為(民法709条)が成立し得る**: YOL(ヨミウリ・オンライン)見出し事件(知財高裁平成17年10月6日)は、記事見出しの著作物性を否定しつつ、他人の見出しのデッドコピー配信を「社会的相当性を逸脱」として不法行為を認めた(賠償約23.8万円)([判決PDF](https://www.courts.go.jp/app/files/hanrei_jp/350/009350_hanrei.pdf)、[解説](https://chosakukenhou.jp/yol-jiken/))。**特定メディアへの網羅的・継続的なタダ乗りは、著作権を回避しても不法行為リスクが残る**。有料課金はこの評価で不利に働く。

### B-3. 文化庁「AIと著作権に関する考え方」(2024)とその後

- **2024年3月15日** 文化審議会著作権分科会法制度小委員会「AIと著作権に関する考え方について」公表: (1)学習は30条の4で原則適法、(2)特定作品の創作的表現の出力を意図する場合は享受目的が併存し30条の4適用外、(3)生成・利用段階は類似性+依拠性で通常判断、(4)RAGへの47条の5適用可能性と軽微性の限界を明記([文化庁AIと著作権ページ](https://www.bunka.go.jp/seisaku/chosakuken/aiandcopyright.html))。
- **2024年7月31日**「AIと著作権に関するチェックリスト&ガイダンス」公表(事業者の立場別のリスク低減策)([PDF](https://www.bunka.go.jp/seisaku/bunkashingikai/chosakuken/seisaku/r06_02/pdf/94089701_05.pdf))。
- **2025年5月30日** 文化庁・経産省「AIと著作権に関する関係者ネットワークの総括」公表([カレントアウェアネス](https://current.ndl.go.jp/car/253613))。法改正はなく「考え方」の枠組みが維持されている。

### B-4. 引用(32条)の要件

判例・通説上の要件: (1)公表された著作物、(2)**明瞭区別性**(カギ括弧・枠等)、(3)**主従関係**(自分の記事が主)、(4)正当な範囲内、(5)**出所明示**(48条)、(6)改変しない(同一性保持権)([解説1](https://www.ishioroshi.com/biz/kaisetu/chosakuken/index/inyou/)、[解説2](https://chosakukenhou.jp/inyou/))。要約しての引用は東京地判平成10年10月30日が許容した例があるが学説上争いあり。**「リンク+出典明記」はそれ自体で適法化する魔法ではないが**、単純リンクは著作権利用に当たらず常に適法であり、引用の公正な慣行・不法行為評価の両面で強く有利に働く。

### B-5. 実際の紛争事例

- **読売新聞 v Perplexity**(東京地裁、2025年8月7日提訴): 記事11万9,467本の無断取得・複製と類似回答の生成配信を複製権・公衆送信権侵害等と主張、**約21億6,800万円**の損害賠償と差止を請求。日本の大手報道機関による初の生成AI企業提訴([Ledge.ai](https://ledge.ai/articles/yomiuri_sues_perplexity_2025)、[西村あさひ解説](https://www.nishimura.com/ja/knowledge/newsletters/intellectual_property_robotics_artificial_intelligence_251211))。
- **朝日新聞・日経新聞 v Perplexity**(2025年8月26日共同提訴、計44億円請求)。第1回口頭弁論が2026年5月14日に開催され係属中([Impress Watch](https://www.watch.impress.co.jp/docs/news/2041960.html))。
- 海外: NYT v Perplexity(ペイウォール内記事のRAG配信を問題視)([Ledge.ai](https://ledge.ai/articles/nyt_perplexity_ai_lawsuit))、NYT v OpenAI、Dow Jones v Perplexity等。**いずれも「報道記事を収集し要約して配信する」行為が争点で、構想中サービスが報道記事を対象にした場合の直接の先例リスク**。

## C. 実務的リスク低減策(結論)

### やってよいこと(低リスク)
1. **公式RSS/Atom・GitHub Releases・公式APIなど提供者が明示的に公開した経路のみで収集**(robots.txt遵守、User-Agent明示、適切なポーリング間隔)
2. **「事実の抽出→自分の言葉での再構成」型の記事生成**: リリース・機能追加という事実は保護対象外。原文の表現・構成をなぞらないようプロンプトで制御(原文フレーズの直訳連結を避ける)
3. 全記事に**原文リンク+出典明示**、要約は「原文の代替にならない粒度」(見出し+数文+リンクで原文へ誘導)に留める
4. 原文の一節を示す場合は**32条の引用要件**(明瞭区別・主従・出所明示)を満たす形式に統一
5. X本文が必要なら公式埋め込みウィジェットかリンクのみ。SNSは**Bluesky優先**(無料・再配布制約が緩い)
6. 削除請求窓口とnotice & takedown手順を利用規約に整備。学習拒否(robots.txt、meta指示)を尊重するポリシーを公表

### 避けるべきこと(高リスク)
1. **新聞社等の報道記事の網羅的な要約配信**(Perplexity訴訟の争点そのもの。ベンダー公式ブログ・リリースノート中心に絞ることが最大のリスク低減)
2. 記事の**全文転載・全文翻訳の配信**(翻訳は翻案。権利者許諾が必要)
3. **ペイウォール内・ログイン必須コンテンツの取得**、技術的措置(robots.txt等)の回避クロール(30条の4ただし書該当のおそれ)
4. **X APIで取得したポスト本文のDB保存と再配信**(Developer Agreementの再配布禁止・AI訓練禁止に抵触)、Xの無断スクレイピング
5. 特定ソースの見出し・記事への継続的・網羅的な依存(著作権非侵害でもYOL事件型の不法行為リスク)
6. Product Hunt APIの無断商用利用(要事前承諾)、Reddit APIの未承認商用利用

### アーキテクチャ含意
収集基盤は**RSS/Atom+GitHub Releases Atomで9割賄え、ほぼ無料**。X APIは月数十〜数百ドル+再配布禁止のためコア依存を避け、Bluesky・公式ブログRSSで代替。Anthropic等RSS欠落ソースはニュースレター受信パースか低頻度の自前クロール(規約・robots.txt遵守)で補完。LLM要約は「事実ベース・自分の言葉・原文リンク必須」をプロダクト仕様として固定することが、コストと法的リスクの両方を最小化する。