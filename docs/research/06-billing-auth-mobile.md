# digest
【課金】日本中心・少額サブスクならStripe一択: 国内カード3.6%+Billing 0.7%で固定手数料なし(¥500課金でも約¥22)。MoR型Paddle(5%+$0.50、日本の消費税を代理納付・インボイス対応不要)は海外展開時に有効だが固定50¢で少額は手数料負け。Lemon SqueezyはStripe買収でStripe Managed Paymentsへ統合中のため新規非推奨(代替はPolar 4%+40¢)。【認証】better-auth推奨(無料・Hono公式サンプル・Auth.jsチームが合流済みで新規Auth.jsは非推奨)。DBをSupabaseにするならSupabase Auth(Pro $25/月・100k MAU)。Clerkは無料50k MRUでDX最強、@hono/clerk-authあり。【モバイル】Expo+Hono共用は標準構成で現実的。EAS Free(月15+15ビルド)→Starter $19、Expo Push無料。IAPはスマホ新法(2025/12施行)で日本は外部Webリンク15%(小規模10%)、Google外部決済20%(Play Billing併設必須)、米国は外部リンク0%だが係争中。推奨は「Web課金・アプリ閲覧専用」のNetflixモデルで手数料回避。【トライアル】カード必須7-14日(転換率31.4% vs 不要8.9%)。特商法の最終確認画面表示義務とtrial_will_end 3日前リマインダー対応が必須。

# verified_facts
- [OK] Stripeの日本国内カード決済手数料は3.6%/取引で固定手数料・月額なし。Stripe Billingは取引額の+0.7%(合計実効約4.3%)
- [OK] Paddleは5%+$0.50/取引のMoRで、日本の消費税10%をB2B/B2Cともに代理徴収・納付する(開発者側のインボイス対応が不要になる)
- [NG] Lemon SqueezyはStripeに買収され機能はStripe Managed Paymentsへ統合中。2026年時点で新規採用は非推奨、代替はPolar(4%+$0.40) => 訂正: Lemon SqueezyのStripe買収(2024年7月)とStripe Managed Paymentsへの統合中(2026年1月28日付公式ブログ、2026年2月パブリックプレビュー)は正しい。ただし代替候補Polarの料金「4%+$0.40」は古い。Polarは2026年5月27日に料金改定し、新規組織の無料Starterプランは5%+$0.50。4%+$0.40(+サブスクリプション0.5%)は2026年5月27日以前に作成された組織限定のEarly Member(grandfathered)料金。有料プランはPro $20/月(3.8%+$0.40)、Growth $100/月(3.6%+$0.35)、Scale $400/月(3.4%+$0.30)で、非米国カードは全プラン+1.5%。また「新規採用は非推奨」は公式声明ではなく解釈であり、Lemon Squeezyの新規サインアップ自体は停止されていない(Managed Paymentsは記事時点でウェイトリスト制)。
- [NG] スマホ新法(MSCA)が2025年12月18日全面施行。Apple日本の外部Webリンク手数料は15%(小規模事業者10%)、Google外部決済は20%でPlay Billing併設必須 => 訂正: Googleの日本向け外部決済(external payments program)の手数料は一律20%ではなく段階制: 自動更新サブスクリプションは10%、年間開発者収益100万ドル(USD)までの取引は10%、それ以外のアプリ内デジタルコンテンツ購入は20%。手数料は外部決済リンク遷移後24時間以内の購入に適用され、プログラムは日本のユーザー限定。Google Play Billingとのside-by-side(併設)提示は必須(この点は主張どおり)。なお、施行日(2025年12月18日全面施行)とAppleの料率(外部Webリンク15%、小規模事業者等10%)は正確だが、Appleの手数料はリンククリック後7日以内の売上に適用される条件付き。
- [?] 米国App Storeの外部リンクは2025年4月以降手数料0%だが、2026年4月に第9巡回区が差戻し料率を再審理中で暫定状態

# report
# 課金・認証・モバイル展開 調査レポート(2026年7月5日時点)

## (A) サブスク課金: Stripe vs Merchant of Record (Paddle / Lemon Squeezy)

### Stripe(日本)の手数料
- 国内カード決済: **3.6%/取引(固定手数料なし・月額なし)**。海外カードは通貨換算が絡む場合に**+2%**。コンビニ決済3.6%(最低¥120)、銀行振込1.5%([Stripe公式料金](https://stripe.com/jp/pricing))
- **Stripe Billing(サブスク管理): Billing経由取引額の+0.7%**(決済手数料3.6%とは別建て)。カスタマーポータルのカスタムドメインは$10/月([Stripe Billing料金](https://stripe.com/jp/billing/pricing))。0.5%→0.7%への改定経緯は[DevelopersIO](https://dev.classmethod.jp/articles/stripe-billing-fee-and-tax/)参照。BillingなどのSaaS的手数料には2023年10月以降、日本の消費税10%が上乗せされる点に注意
- **少額サブスクの「手数料負け」**: 日本のStripeは米国(2.9%+30¢)と違い**固定額部分がない**ため、少額課金でも手数料率は約4.3%(3.6%+0.7%)で一定。¥500/月でも手数料は約¥22。日本国内向け少額サブスクではStripeが圧倒的に有利([比較記事: ENHANCE IT](https://enhanceit.jp/stripe-tesuryo-hikaku/))

### Paddle(MoR型)
- **5% + $0.50/取引**。月額なし。税務コンプライアンス・不正/チャージバック対応込み。$10未満の商品はカスタム料金の相談が必要([Paddle公式料金](https://www.paddle.com/pricing))
- **日本の消費税(10%)をB2B/B2Cともに代理徴収・納付**する対象国リストに日本が含まれる([Paddle公式ヘルプ](https://www.paddle.com/help/sell/tax/which-countries-does-paddle-charge-sales-tax-or-vat-for))
- **固定$0.50が少額サブスクに致命的**: ¥500/月なら手数料は約¥100(実効約20%)。¥1,500/月でも約¥150(10%)。少額プランを想定するならMoRは不利

### Lemon Squeezy
- 表面レートはPaddleと同じ**5% + 50¢**だが、**国際取引+1.5%、PayPal+1.5%、サブスク決済+0.5%、米国外payout 1%**などの追加手数料がある([Swellの料金分解](https://www.swell.is/content/lemon-squeezy-pricing)、[Dodo Paymentsレビュー](https://dodopayments.com/blogs/lemonsqueezy-review))
- **2024年にStripeが買収**([TechCrunch](https://techcrunch.com/2024/07/26/stripe-acquires-payment-processing-startup-lemon-squeezy/))し、機能は**Stripe自身のMoR「Stripe Managed Payments」へ統合中**([Lemon Squeezy 2026 Update](https://www.lemonsqueezy.com/blog/2026-update)、[Paddleによる解説](https://www.paddle.com/resources/stripe-managed-payments))。買収後はサポート遅延・出金保留の報告が複数あり([Zenn体験談](https://zenn.dev/genshi_ai/articles/45fca78bb77f4f))、**2026年時点で新規採用は非推奨**。MoR代替としては**Polar(4% + 40¢)**が個人開発者に人気([Polar公式比較](https://polar.sh/resources/comparison/lemon-squeezy))

### 日本のインボイス/消費税の観点
- **Stripe直販の場合**: あなた自身が販売者。基準期間の課税売上1,000万円以下なら免税事業者のままでよく、**顧客がB2C(消費者)ならインボイス(適格請求書)発行の実務的必要性は低い**。B2B顧客が増えるとT番号登録(=課税事業者化)の圧力がかかる
- **MoR(Paddle等)の場合**: 販売者はPaddle。エンドユーザーへの消費税徴収・納付・請求書はPaddleが処理。**開発者→Paddleへの売上は国外取引扱いで消費税不課税となり、インボイス対応自体が不要になる**のがMoR最大の利点([Qiita比較記事](https://qiita.com/mintototo1/items/79d6ca7d6b21da122b46)、[弥生: 海外取引と消費税](https://www.yayoi-kk.co.jp/seikyusho/oyakudachi/kaigaitorihiki-shohizei/))。海外販売時も、日本の事業者が外国で自力で税登録する負担(日本は閾値1,000万円+税務代理人必須の国もある)を丸ごと回避できる([Paddle SaaS Sales Tax Guide](https://www.paddle.com/blog/saas-sales-tax-state-wide-and-international))

### 推奨(A)
- **日本ユーザー中心・少額(〜¥1,500/月)・初期1,000ユーザー規模なら Stripe + Stripe Billing 一択**。手数料負けせず、Checkout/Customer Portal/Webhookで個人でも実装容易。EMV 3-Dセキュア(3DS2)は2025年3月末までに全EC加盟店で必須化済みなので、Stripe側の3DS設定を有効にしておく([BUSINESS LAWYERS](https://www.businesslawyers.jp/articles/1447)、[Stripe解説](https://stripe.com/resources/more/3d-secure-mandatory-for-ecommerce-in-japan))
- 英語圏へ本格展開し海外売上比率が高まったら**Paddle併用またはStripe Managed Payments(正式公開後)を検討**。Lemon Squeezyの新規採用は避ける

## (B) 認証: Supabase Auth / Clerk / Auth.js / better-auth / Firebase Auth

| サービス | 無料枠 | 有料 | Hono+Next.js適合性 |
|---|---|---|---|
| Supabase Auth | 50,000 MAU | Pro $25/月で100k MAU、超過$0.00325/MAU | JWT(JWKS)検証でHono側保護が容易。公式Honoガイドあり |
| Clerk | **50,000 MRU**(2026年2月に1万→5万へ拡大) | Pro $25/月($20年払)、超過$0.02/MRU | `@hono/clerk-auth`公式ミドルウェアあり。UIコンポーネントが最強 |
| Auth.js (NextAuth) | OSS無料 | - | **新規非推奨**: 2025年9月にチームがBetter Authに合流 |
| better-auth | OSS無料 | - | **Hono公式サンプルあり**。DB(Postgres/Drizzle)に自前セッション保存 |
| Firebase Auth | 50,000 MAU無料(SMS認証は従量課金・Blaze必要) | 超過はGoogle Cloud料金 | Firebase Admin SDKでのJWT検証は可能だがPostgres+Hono構成とはやや相性が悪い |

- Supabase: Freeは50k MAUだが**プロジェクトが1週間非アクティブで停止**、本番はPro $25/月が実質必須([Supabase公式料金](https://supabase.com/pricing)、[Honoクイックスタート](https://supabase.com/docs/guides/getting-started/quickstarts/hono))
- Clerk: 課金単位が**MRU(サインアップ24時間後に再訪したユーザーのみカウント)**で、試しただけのユーザーに課金されない([Clerk公式料金](https://clerk.com/pricing)、[改定解説](https://saasprices.net/blog/clerk-free-plan-changes))。Honoミドルウェア: [@hono/clerk-auth](https://www.npmjs.com/package/@hono/clerk-auth)
- Auth.js→Better Auth移行の公式アナウンス: [GitHub Discussion](https://github.com/nextauthjs/next-auth/discussions/13252)、[Better Auth移行ガイド](https://authjs.dev/getting-started/migrate-to-better-auth)。2026年の新規プロジェクトはbetter-authが推奨との評価([LogRocket比較](https://blog.logrocket.com/best-auth-library-nextjs-2026/)、[Better Stack比較](https://betterstack.com/community/guides/scaling-nodejs/better-auth-vs-nextauth-authjs-vs-autho/))
- better-authは[Hono公式サンプル](https://hono.dev/examples/better-auth)があり、レート制限・パスワードポリシー・2FA内蔵、セッションを自DBに置けて即時失効可能
- Firebase Auth: [公式料金](https://firebase.google.com/pricing)で50k MAUまで無料、電話認証はSMS従量

### 推奨(B)
- **第一候補: better-auth**(無料・ベンダーロックインなし・Hono/Next.js両対応・将来のExpo対応プラグインもある)。DBを既に持つ構成(記事保存用Postgres)と自然に統合できる
- **DB自体をSupabaseにするならSupabase Authでまとめるのも合理的**(認証+DB+RLSで$25/月に収まる)
- 開発速度最優先・組織機能や管理UIが欲しいならClerk(1,000ユーザー規模なら無料枠内)。Firebase Authはこの構成では積極的に選ぶ理由が薄い

## (C) 将来のモバイル化: Expo + Hono共用、EAS料金、IAPルール

### 構成の現実性
- HonoバックエンドはただのHTTP/REST(+RPCモード)なので、**Next.js WebとExpoアプリからの共用は標準的な構成で全く問題ない**。better-auth/Supabase Auth/ClerkいずれもExpo用SDK/プラグインがある
- **Expo EAS料金**([公式](https://expo.dev/pricing)): Free $0(**月15 Android + 15 iOSビルド**、EAS Update 1,000 MAU)/ Starter $19(ビルドクレジット$45、Update 3,000 MAU)/ Production $199(Update 50,000 MAU)。ローカルビルドや自前CIを使えばEAS費用はさらに抑えられる
- **Expo Push通知は完全無料**(内部でFCM/APNsをラップ、送信上限600通/秒)([Expo公式FAQ](https://docs.expo.dev/push-notifications/faq/))。メール通知が主でもモバイル化時のプッシュ移行コストは低い

### App Storeのサブスク/IAPルール(2026年7月時点)
- **原則**: アプリ内でデジタルサブスクを販売するならIAP必須(米国標準手数料30%、Small Business Program(年売上$100万未満)で15%)。ただし地域ごとに大きく分岐:
- **日本(重要)**: **スマホソフトウェア競争促進法(スマホ新法/MSCA)が2025年12月18日に全面施行**([公正取引委員会](https://www.jftc.go.jp/msca/)、[ゲームメーカーズ](https://gamemakers.jp/article/2025_12_18_126534/))。Appleは日本向けにiOS 26.2で対応し、新手数料体系を発表([mjtsai まとめ](https://mjtsai.com/blog/2025/12/18/japan-app-marketplaces-external-payments-new-fee-structure/)、[Daring Fireball](https://daringfireball.net/2025/12/apple_japan_msca_compliance)):
  - IAP継続: 21%+決済処理5%(小規模事業者は10%+5%=**15%**)
  - アプリ内代替決済: 21%(小規模10%)+自分の決済手数料
  - **外部Webリンク(リンクタップ後7日以内の購入に課金): 15%、小規模事業者は10%**
  - 代替マーケットプレイス配布: Core Technology Commission 5%
- **Google(日本)**: External Payments Program(アプリ単位で申請制)で外部決済リンク可、**リンク後24時間以内の購入に20%**。ただし**外部決済のみは不可でGoogle Play Billing併設が必須**([Appcharge解説](https://www.appcharge.com/blog/external-payments-in-japan-the-fine-print-behind-apple-and-google-compliance)、[Android Developers](https://developer.android.com/google/play/billing/externalpaymentlinks))。プラットフォーム手数料+自前決済コストを合算すると**IAPより安くならないケースが多い**点に注意
- **米国**: 2025年4月のEpic訴訟法廷侮辱認定以降、**外部リンク経由の購入にAppleは手数料を課せない状態が継続**。ただし2026年4月に第9巡回区控訴裁が差戻し、Appleが徴収できる料率を下級審で再審理中+Appleは最高裁に上告(2026年5月)。**「外部リンク0%」は暫定状態**で将来12-27%型の手数料が復活する可能性がある([MacRumors](https://www.macrumors.com/2026/04/29/epic-games-wins-reversal-app-store-fee-battle/)、[TechCrunch](https://techcrunch.com/2026/04/29/apple-epic-games-app-store-fees-pause-changes-supreme-court/)、[RevenueCat解説](https://www.revenuecat.com/blog/growth/apple-anti-steering-ruling-monetization-strategy/))
- **EU(DMA)**: Core Technology Fee(€0.50/インストール)から**売上ベース5%のCore Technology Commissionへ移行中**で、外部決済の合計手数料は構成により約10〜20%。移行は2026年半ば時点でもEU委員会と調整中([RevenueCat](https://www.revenuecat.com/blog/growth/apple-eu-dma-update-june-2025/)、[Apple公式](https://developer.apple.com/support/dma-and-apps-in-the-eu/))

### 推奨(C)
- **最有力戦略: 「Webで課金、アプリは閲覧専用」(Netflix/Spotifyモデル)**。アプリ内で販売もリンク誘導もしなければIAP手数料は一切かからない(reader app系のExternal Link Account Entitlementで自サイトへのリンクも申請可能)([Engadget](https://www.engadget.com/apple-netflix-spotify-reader-apps-link-sites-payment-044147213.html))。本アプリはニュース/雑誌型コンテンツなのでreader appに該当しやすい
- アプリ内課金導線が欲しくなったら、日本では外部Webリンク(小規模10%)、米国では外部リンク(現状0%だが流動的)を活用。**規制が地域ごとに毎年動いているため、IAP対応を前提にした価格設計(Web価格より15%増しのIAP価格など)を最初から想定しておく**とよい
- Expoは無料枠で十分開始可能。EAS Update(OTA更新)はStarter $19で3,000 MAUまで

## (D) 有料オンリー開始時の無料トライアル設計

### データ(ベンチマーク)
- ChartMogul(約200プロダクト)の2026年データ: **カード登録必須(opt-out)トライアルの有料転換率は平均31.4%、カード不要(opt-in)は8.9%**([ChartMogul SaaS Conversion Report](https://chartmogul.com/reports/saas-conversion-report/)、[IdeaProofまとめ](https://ideaproof.io/questions/good-trial-conversion))。カード必須はサインアップ数が減るが、最終的な有料顧客数はカード必須の方が多いという分析もある([Pulseahead](https://www.pulseahead.com/blog/trial-to-paid-conversion-benchmarks-in-saas))

### 推奨設計
1. **カード登録必須の7〜14日トライアル(opt-out)を推奨**。有料オンリー戦略と整合的で、冷やかしユーザーへのLLM要約コスト(従量課金)を防げる。真剣なユーザーだけが入るためサポート負荷も低い
2. **Stripeでの実装**: Checkoutの`trial_period_days` + `trial_settings.end_behavior.missing_payment_method`(カードなしトライアルにする場合は`cancel`/`pause`を指定)。**`customer.subscription.trial_will_end`イベントがトライアル終了3日前に発火**するので、これをフックに終了予告メールを必ず送る([Stripe公式ドキュメント](https://docs.stripe.com/billing/subscriptions/trials))
3. **法令対応(日本)**: 2022年改正特定商取引法により、申込みの**最終確認画面で「無料期間終了後に有料へ自動移行する時期・金額・解約方法」の明示が義務**。違反は行政処分・取消リスクあり([消費者庁資料](https://www.caa.go.jp/policies/policy/consumer_transaction/specified_commercial_transactions/assets/consumer_transaction_cms202_220601_05.pdf)、[骨董通り法律事務所コラム](https://www.kottolaw.com/column/230125.html))。Stripe Checkoutの規約同意+自前の確認画面文言で対応
4. **信頼設計**: 終了前リマインダー明示(Canva方式)は登録率と初期解約率の双方に効く([ChartMogul](https://chartmogul.com/reports/saas-conversion-report/))。Stripe Customer Portalでセルフ解約導線を必ず用意
5. **転換の鍵は最初の7日の価値体験**: 登録直後に興味トピック設定→即日ダイジェスト配信が届く体験を最短で作る([1Capture分析](https://www.1capture.io/blog/free-trial-conversion-benchmarks-2025))
6. 代替案として「トライアルなし+初月割引+30日返金保証」も少額サブスクでは有効(トライアル管理・特商法表示がシンプルになる)

## 全体推奨アーキテクチャ(課金・認証・通知)
- 課金: **Stripe Billing + Checkout + Customer Portal**(実効手数料約4.3%+一部手数料に消費税)。月額プランは¥980〜1,980帯なら手数料負けの心配なし。年額プランを併設して決済回数と手数料・離脱を削減
- 認証: **better-auth(Hono公式サンプルあり)**、またはDBごとSupabaseに寄せるならSupabase Auth。1,000ユーザー規模ではどちらも実質無料
- モバイル: Expo(EAS Free→Starter $19)。課金はWebのみで開始しIAPを回避、日本のスマホ新法・米Epic判決の推移を見てアプリ内購入導線を後付け判断