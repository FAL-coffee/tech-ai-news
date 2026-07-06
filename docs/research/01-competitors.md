# digest
競合調査の結論: (1)海外はTLDR(無料広告モデル・13誌720万読者)、Feedly Pro+(年$99でAI要約)、daily.dev Plus(月$14.99/年$89.99)、Particle+($2.99/月)が主要プレイヤーで、汎用AIニュースのArtifactは「市場が小さい」と2024年に終了しYahooに買収された。(2)日本はTechFeed/はてブ/Qiita/Menthasが全て無料・広告モデルで、有料はSmartNews+(月1,480円・購読10万人)とB2BのStockmark Anews(旧月29,800円〜、現在は製造業特化Aconnectに転換)のみ。(3)「一次情報特化×日本語AI記事化×トピック粒度メール配信」の有料サービスは日英とも空白。差別化は一次情報限定による信頼性・速報性・著作権リスク低減と日英バイリンガル生成。ただし無料競合が極めて強いため、テック/開発者ニッチ死守と業務価値訴求が必須。(4)価格は個人月980円(年払い割引)が妥当ライン。$3(床)〜1,850円(NewsPicks上限帯)の間で、1,000ユーザー×980円=月商98万円で小規模運用が成立。B2Bチームプラン(月3万円〜)が将来の単価向上策。要約・翻訳の著作権(翻訳権・翻案権)とX API規約は法務要確認。

# verified_facts
- [?] Feedly Pro+(AI機能込み)は年払い$8.25/月($99/年)・月払い$12.99、法人向けMarket Intelligenceは月$1,600〜
- [?] daily.dev PlusはApp Store課金で月$14.99/年$89.99(AIブリーフィング等を有料化)
- [?] TLDR Newsletterは読者完全無料・広告のみ(スポンサー枠1回約$15,000〜18,000)で13誌計720万読者、2025年売上8桁ドル
- [?] Particle+は月$2.99/年$29.99で、B2CのAIニュース課金の価格の床を示す
- [?] Artifactは「市場機会が継続投資を正当化するほど大きくない」として2024年1月に終了発表、同年4月にYahooが買収し技術をYahoo Newsに統合

# report
# 類似サービス・競合分析レポート(テック/AI一次情報のAI要約×トピック購読×メール配信サービス)

調査日: 2026年7月5日。料金は各出典時点の公開情報。

---

## 1. 海外サービス

### 1.1 Feedly(RSSリーダー+AI)
- **概要**: 世界最大級のRSSベース情報収集ツール。AI機能「Feedly AI(旧Leo)」でノイズ除去・優先度付け・AI Feeds(自然言語でのフィード定義)が可能。
- **料金**: Free $0(〜100ソース、AIなし)/ Pro 年払い$6/月($72/年)・月払い$6.99 / **Pro+ 年払い$8.25/月($99/年)・月払い$12.99(AI機能はPro+のみ)**。Enterprise(Market Intelligence)は**月$1,600〜**と法人向けは桁が変わる。
  - 出典: [Feedly公式プラン説明](https://docs.feedly.com/article/140-what-is-the-difference-between-feedly-basic-pro-and-teams) / [Feedly Pro](https://feedly.com/i/pro) / [料金まとめ(2026)](https://www.readless.app/blog/feedly-pro-pricing-vs-readless-2026) / [socialrails](https://socialrails.com/blog/feedly-pricing) / [Market Intelligence料金](https://feedly.com/market-intelligence/pricing)
- **ターゲット**: 個人パワーユーザー〜法人インテリジェンス部門。
- **情報源**: ユーザーが自分でRSS/ブログ/ニュースレター等を登録(一次情報も媒体記事も可)。
- **AI要約**: あり(Pro+以上。要約・重複排除・トピック分類)。
- **強み**: 汎用性・歴史・法人向け高単価モデル。**弱み**: セットアップの手間が大きい(自分でソース登録)、記事生成やメールダイジェストは弱い、日本語UI/日本語要約は非対応に近い。

### 1.2 daily.dev(開発者向けフィード)
- **概要**: ブラウザ新規タブに開発者向け記事を集約表示するフィード+コミュニティ。数百ソースを集約。
- **料金**: 基本無料(広告)。**Plusサブスク: App Store表示で月$14.99 / 年$89.99**。Plus機能は「Presidential Briefing(パーソナルエージェントが100+記事を分析しブリーフィング)」「Smart Titles」「Clickbait Shield」等、AI機能を有料化している。
  - 出典: [App Store(In-App課金)](https://apps.apple.com/us/app/daily-dev/id6740634400) / [Chrome Web Store](https://chromewebstore.google.com/detail/dailydev-developer-news-d/jlmpjdjjbgclbocgajdjefcidcncaied) / [Introducing daily.dev Plus](https://app.daily.dev/posts/introducing-daily-dev-plus--juqamgw1p)
- **ターゲット**: 世界の開発者(B2C)。
- **情報源**: 技術ブログ・媒体記事の混合(一次情報特化ではない)。
- **AI要約**: Plusでタイトル改善+ブリーフィング等。記事全文の日英生成はない。
- **強み**: 巨大コミュニティ、新規タブという強い習慣性。**弱み**: 英語のみ、フィードがノイジー(コミュニティ投稿依存)、メールダイジェストが主軸ではない。

### 1.3 TLDR Newsletter(無料メールの王者)
- **概要**: 平日毎日配信の要約ニュースレター群。TLDR本体・TLDR AI・TLDR Web Dev等**13誌で計720万読者**(2026年6月時点)。本体160万・AI版110万、開封率47%。
- **料金**: **読者は完全無料。収益は広告のみ**(1号あたり最大3枠、プライマリスポンサー約$15,000〜18,000/回)。2025年の売上は8桁ドル超(=1,000万ドル超)。有料プラン・ペイウォールなし。
  - 出典: [TLDR公式](https://tldr.tech/) / [広告ページ](https://advertise.tldr.tech/) / [Readlessレビュー2026](https://www.readless.app/blog/tldr-newsletter-review-2026) / [Growth In Reverse分析](https://growthinreverse.com/tldr/)
- **情報源**: 一次情報(リリース・公式ブログ)+媒体記事を人力キュレーション+短文要約。
- **AI要約**: 基本は編集者による人力要約。
- **強み**: 圧倒的リーチと「5分で読める」フォーマット。**弱み**: 英語のみ、パーソナライズなし(トピック別は「誌」単位)、アーカイブ/検索体験が弱い。**このモデルが「無料+広告」で成立している事実は、有料課金モデルにとって最大の競合圧力**。

### 1.4 Techmeme
- **概要**: 2005年からのテックニュース見出しアグリゲーター。編集者+アルゴリズムで「今テック業界で重要な話題」を1ページに集約。一次情報(企業発表・公式ブログ)へのリンクを重視。
- **料金**: 読者無料。収益は広告+Leaderboards等のデータ販売+**2020年開始の法人向け「ニュースフィルタリング/整理」受託サービス**。ニュースレター+法人事業で年$1M〜5M。自己資金・独立経営。
  - 出典: [About Techmeme](https://www.techmeme.com/about) / [Crazy Stupid Tech(2025年9月)](https://crazystupidtech.com/2025/09/08/at-20-techmeme-has-never-been-hotter/)
- **AI要約**: なし(見出しリライトのみ)。
- **強み**: 業界標準の信頼性、一次情報リンク文化。**弱み**: 英語のみ、パーソナライズなし、B2C課金なし。

### 1.5 Hacker Newsletter
- **概要**: Hacker Newsのベスト記事を毎週人力キュレーションする1人運営ニュースレター(2010年〜)。約6万購読者。2026年時点でも継続中(従業員1名)。
- **料金**: 無料(スポンサー広告)。
  - 出典: [公式](https://hackernewsletter.com/) / [Tracxn(2026年4月時点)](https://tracxn.com/d/companies/hackernewsletter/__lO2fZvXn7gPy5PdHttRaug8-PY4nNg_POYsRTTNG4T8)
- **強み/弱み**: 1人でも長期継続できる軽量モデルの実例。逆に言えば機能面の進化はない。

### 1.6 Refind
- **概要**: 10k+ソース・1k+のソートリーダー(X等)を監視し、アルゴリズム+コミュニティ+専門家キュレーションで「毎日数リンク」をメール配信。50万人以上が利用。
- **料金**: 無料版+**Premium $89/年**(トピック別リンク増量)。ニュースレター向け広告事業(CPA型)も展開。
  - 出典: [refind.com](https://refind.com/) / [Premium](https://refind.com/premium)
- **AI要約**: 要約より「選別」が主。**強み**: 「1日数本だけ」という情報ダイエット設計、トピック購読×メールという構造は本構想に最も近い。**弱み**: 英語のみ、要約・記事化なし、鮮度より「timeless」重視で速報性が弱い。

### 1.7 Particle.news
- **概要**: 元Twitter幹部が創業したAIニュースアプリ。複数ソースを1ストーリーに束ねAI要約、多視点表示、AIへの追加質問、出典リンク常時表示。2026年2月にAndroid/世界展開+ポッドキャストの要点クリップ機能を追加。Series A $10.9M(Lightspeed、Axel Springer)。
- **料金**: 基本無料+**Particle+ 月$2.99 / 年$29.99**(要約スタイル指定、音声、AIチャット無制限等)。
  - 出典: [App Store](https://apps.apple.com/us/app/particle-personalized-news/id6683283775) / [TechCrunch(2026/2)](https://techcrunch.com/2026/02/23/particles-ai-news-app-listens-to-podcasts-for-interesting-clips-so-you-you-dont-have-to/)
- **強み**: AI要約UXの完成度(多視点・出典明示)。**弱み**: 一般ニュース中心でテック特化ではない、$2.99という低ARPU。**B2CのAIニュース課金の「価格の床」を示す事例**。

### 1.8 Perplexity Discover
- **概要**: Perplexityの無料ニュースフィード機能。AIが話題をまとめて要約ページ化。
- **料金**: Discover自体は無料。Pro **月$20**、Max 月$200、Enterprise Pro 月$40/席。
  - 出典: [eesel AIによる料金ガイド](https://www.eesel.ai/blog/perplexity-pricing) / [aipicks(2026)](https://aipicks.jp/mag/perplexity-pro-guide-2026)
- **強み**: 汎用AI検索とのバンドル。**弱み**: トピック購読×メール配信の体験は弱く、テック一次情報の網羅巡回ではない。

### 1.9 Artifact(終了 → Yahoo買収)★重要な先行事例
- **概要**: Instagram創業者(Systrom/Krieger)による AIパーソナライズドニュースアプリ(2023年1月公開)。
- **経緯**: **2024年1月「市場機会が継続投資を正当化するほど大きくない」として終了発表**。米国外でユーザーが伸びず、DL数がローンチ後急減。**2024年4月にYahooが買収**(3/29クローズ、金額非公開)し、AIパーソナライズ技術をYahoo Newsに統合。単体アプリとしては消滅。
  - 出典: [TechCrunch: 失敗分析](https://techcrunch.com/2024/01/18/why-artifact-from-instagrams-founders-failed-shut-down/) / [Yahoo公式発表](https://www.yahooinc.com/press/yahoo-announces-the-acquisition-of-artifact-the-news-discovery-platform-created-by-instagram-cofounders-kevin-systrom-and-mike-krieger) / [Failory分析](https://newsletter.failory.com/p/why-artifact-failed)
- **教訓**: 「汎用ニュース×AIパーソナライズ」は無料でもスケールしなかった。**ニッチ(テック/開発者)特化と明確な支払い理由(業務価値)が不可欠**。

### 1.10 smry / AIニュース要約系スタートアップ
- **smry.ai**: 記事URLを貼るとクリーン表示+AI要約+音声+チャット。無料+**Pro 月$3**。個人開発・OSS。出典: [smry料金](https://smry.ai/pricing)
- **Readless**: 複数ニュースレターを1つのダイジェストに統合するサービス(TLDR等の「まとめのまとめ」)。出典: [readless.app](https://www.readless.app/blog/best-ai-news-aggregators-2026)
- **The Rundown AI**: 無料AIニュースレター、読者200万人超。英語のみ。出典: [therundown.ai](https://www.therundown.ai/)
- 示唆: 要約「ツール」は$3/月程度の低単価。無料ニュースレターが強く、要約単体では課金理由が弱い。

---

## 2. 日本のサービス

### 2.1 Stockmark Anews → Aconnect(B2B) ★日本の最重要参照事例
- **概要**: AIが約35,000サイト(ニュース・特許・論文・官公庁レポート)を巡回し、組織の関心に合わせて配信+AI要約する法人向けサービス。
- **重要な変化**: 旧製品ページ(stockmark.co.jp/product/anews)は現在**「製造業向けAIエージェント Aconnect」へリダイレクト**されており、汎用ニュース配信から製造業特化AIエージェントへ転換した。現行料金は個別見積(非公開)。
- **旧Anews料金**: **月29,800円〜**、無料プランあり(3キーワード・3ユーザーまで)。
  - 出典: [Aconnect公式](https://aconnect.stockmark.co.jp/) / [AIsmiley掲載情報](https://aismiley.co.jp/product/recommend-anews/) / [日刊工業新聞(無料プラン)](https://www.nikkan.co.jp/releases/view/5737)
- **示唆**: 日本で「AIニュース収集×配信」を月3万円〜のB2B価格で成立させた実績がある一方、**汎用のまま留まらず業界特化AIエージェントに進化した**=汎用情報配信だけでは単価維持が難しかった可能性。

### 2.2 TheNews(ザ・ニュース)
- **概要**: 2020年ローンチの国産アプリ。デザイナー/デベロッパー向けに The Next Web、Wired、Dribbble、Awwwards 等の**英語圏メディアを1アプリに集約**して流し読みできる。
- **料金**: 無料。AI要約・翻訳なし(英語のまま)。
  - 出典: [note紹介記事](https://note.com/isobe1048/n/n30a10a7ccb05) / [Appliv](https://app-liv.jp/797358166/)
- **示唆**: 「日本人エンジニア/デザイナーが英語一次ソースを読みたい」ニーズの存在証明。ただし翻訳・要約・通知がなく、本構想はここを埋められる。

### 2.3 SmartNews / Gunosy(B2C大手)
- **概要**: 広告モデルの無料ニュースアプリ(Gunosyは国内4,700万DL)。テック特化ではない。
- **SmartNews+**: 有料メディア50媒体以上の厳選記事読み放題サブスク。**月1,480円**(キャンペーンで980円)。2025年7月に累計購読者10万人突破。
- **AI要約**: SmartNewsは2025年7月に生成AIによる複数記事要約機能を発表。
  - 出典: [Impress Watch(月1,480円)](https://www.watch.impress.co.jp/docs/news/1553638.html) / [SmartNews公式(10万人)](https://about.smartnews.com/ja/news/2397.html) / [日経(AI要約)](https://www.nikkei.com/article/DGXZQOUC23CWO0T20C25A7000000/) / [SmartNews+紹介](https://support.smartnews.com/hc/ja/articles/17456312335129)
- **示唆**: 日本の一般消費者向けニュースサブスクの相場が**月980〜1,480円**であること、10万人獲得に大手でも1年以上要したことが参考になる。

### 2.4 Qiita / Zenn(トレンド通知)
- **概要**: 技術記事投稿プラットフォーム。Qiitaは週間トレンド(日曜/木曜5時更新)、毎日朝夕のトレンドプッシュ通知、メルマガ「Qiitaニュース」を無料提供。Zennはトレンド表示のみでメールダイジェストは公式にはなく、RSS/GAS等で自作するユーザーが多い。
  - 出典: [Qiitaプッシュ通知ヘルプ](https://help.qiita.com/ja/articles/qiita-push-notification) / [Qiita週間トレンド](https://qiita.com/Qiita/items/b5c1550c969776b65b9b) / [Zenn/Qiita通知の自作例](https://zenn.dev/kenghaya/articles/6ff68c70235d49)
- **示唆**: 情報源はコミュニティ投稿(二次情報)であり一次情報の速報ではない。「通知を自作している」ユーザー層は本構想の初期ターゲットになりうる。

### 2.5 TechFeed
- **概要**: 国産のエンジニア向け技術情報プラットフォーム。180〜200+の専門チャンネル、エキスパートモード(リリース・Pull Requestまで追える)、**タイトル自動翻訳**あり。iOS/Android無料。
  - 出典: [TechFeed公式](https://techfeed.io/) / [App Store](https://apps.apple.com/jp/app/techfeed/id1135796018) / [TECH PLAYインタビュー](https://techplay.jp/column/1018)
- **強み**: 本構想に最も近い国産無料競合(一次情報チャンネル+翻訳)。**弱み**: 課金プランなし=マネタイズは広告/イベント依存、AIによる日本語記事生成やメールダイジェストは主機能ではない。

### 2.6 Menthas
- **概要**: 個人開発のプログラマ向けニュースキュレーション(OSS)。カテゴリ別(programming/インフラ/ML等)。無料。月間約4,000ユーザー規模(2020年時点)。
  - 出典: [menthas.com](https://menthas.com/programming) / [開発者Qiita記事](https://qiita.com/ytanaka/items/a0144b623a8dd7fcdbbe) / [GitHub](https://github.com/ytanaka-/menthas)

### 2.7 はてなブックマーク(テクノロジーカテゴリ)
- **概要**: ソーシャルブックマークの人気エントリー(10〜15ブクマで「人気」入り)。テクノロジーカテゴリが日本のエンジニアの事実上の標準情報源。無料。アプリのプッシュ通知はあるがトピック購読×メールダイジェストはない。
  - 出典: [はてなブックマーク開発ブログ(通知)](https://bookmark.hatenastaff.com/entry/2022/11/21/122142) / [人気エントリー条件](https://u-ff.com/hatena-bookmark-requirement/)

### 2.8 日経テレコン(参考: 法人リサーチDB)
- **概要**: 新聞・雑誌記事横断検索の法人向けDB。**月額基本料金8,000円〜(ID数に応じ課金)+記事表示ごとの従量課金**、初期費用は基本料2ヶ月分。
  - 出典: [日経テレコン料金](https://telecom.nikkei.co.jp/price/) / [料金表PDF](https://t21.nikkei.co.jp/public/guide/common/pdf/pricelist.pdf)
- **示唆**: 法人は「業務上必要な情報」に月1万円弱〜数万円を払う。B2B展開時の価格参考。

### 2.9 日本の有料情報サブスク相場(参考)
- NewsPicksプレミアム: **月1,850円**(年割で約2ヶ月分お得) — [公式](https://premium.newspicks.com/)
- 日経電子版: **月4,277円**(税込) — [公式ヘルプ](https://www.nikkei.com/help/subscribe/price/)

---

## 3. ポジショニング分析: 市場の空きと差別化

### 3.1 競合マップの空白
| 軸 | 既存プレイヤー | 空白 |
|---|---|---|
| 一次情報特化 | Techmeme(英語・無料・要約なし)、GitHub Releases/公式ブログ直読 | **一次情報を日本語でAI記事化して届けるサービスは不在** |
| AI要約×テック | daily.dev Plus(英語)、Feedly Pro+(英語・自前設定) | 日本語×テック特化AI要約の有料サービスは実質空白 |
| トピック購読×メール | TLDR(誌単位・無料)、Refind(英語) | **日本語×トピック粒度×デイリーダイジェストは空白** |
| 日本のエンジニア向け | TechFeed/はてブ/Qiita(すべて無料・広告) | **有料B2C課金はどこもやっていない=空白だが「無料が当たり前」という壁でもある** |
| B2B | Stockmark(月3万円〜→製造業特化に転換) | テック/IT企業の開発組織向け「技術情報インテリジェンス」は空きつつある |

### 3.2 差別化ポイント
1. **一次情報限定という編集方針そのものが差別化**: Vercel/OpenAI/GitHub等の公式ブログ・リリースノート・GitHub Releasesに限定することで、(a)情報の信頼性、(b)媒体記事の転載・要約に伴う著作権/契約リスクの低減、(c)速報性(媒体経由より早い)を同時に実現。TechmemeとTLDRが証明した「一次情報リンク文化」の日本語版が存在しない。
2. **日英バイリンガル生成**: 日本人エンジニアの「英語一次情報を読むのがつらい」ペイン(TheNewsやTechFeed翻訳機能が示すニーズ)に対し、AIによる日本語記事化+原文リンクで応える。英語版も出すことで将来の海外展開・SEOの資産になる。
3. **トピック粒度の購読×メール**: TLDRは「誌」単位、はてブ/Qiitaはプッシュのみ。「Next.js」「React」のようなタグ粒度でのデイリーメールダイジェストは日本語では存在しない。
4. **注意すべきリスク(Artifactの教訓)**: 汎用化した瞬間に無料巨人(SmartNews/Google/X)と戦うことになる。テック/開発者ニッチを守り、「業務に効く」価値(キャッチアップ時間の削減)を訴求すべき。また、一次情報とはいえ他者の著作物の翻訳・要約は翻訳権・翻案権に関わるため、「原文への誘導+事実ベースの再構成記事」という設計(Techmeme型)が安全。X(Twitter)を情報源にする場合はAPI利用コストと規約が別途重要な検討事項。

### 3.3 価格設定の相場観
観測された価格帯:
- B2C AIニュース: Particle+ $2.99/月、smry Pro $3/月(=価格の床、約450円)
- 開発者向け情報ツール: Feedly Pro+ $8.25〜12.99/月、daily.dev Plus 年$89.99〜月$14.99(約1,300〜2,200円)
- 日本の一般ニュースサブスク: SmartNews+ 1,480円/月、NewsPicks 1,850円/月(=B2C心理上限帯)
- B2B: 旧Anews 29,800円/月〜、日経テレコン 8,000円/月〜+従量

**推奨**: 個人向けは**月980円(年払い9,800円=約2ヶ月分割引)**を基準に、ローンチ時780円等の早期割引。月500円未満はLLM・メール配信コストと1,000ユーザー規模の売上(50万円/月未満)を考えると回収が苦しく、月1,500円超はSmartNews+/NewsPicksと比較され離脱リスクが高い。980円なら1,000ユーザーで月商98万円となり小規模チームの運用費+LLMコストを賄える。将来のB2Bチームプラン(1席800〜1,000円×5席〜、または組織向け月3万円〜)が単価向上の本命。無料トライアル(7〜14日)+無料枠は「週1ダイジェストのみ」等に限定し、TLDR等の無料競合との差(日本語・トピック粒度・デイリー)を体験で示す設計が妥当。