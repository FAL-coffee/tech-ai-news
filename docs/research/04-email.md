# digest
推奨はResend Pro+react-email。1,000ユーザー(月3万通)で$20/月、5,000ユーザー(月15万通)で$80/月(Pro$35+超過$0.90/1k)。東京リージョン送信対応でNext.js/TSスタックと親和性最高、webhookで開封/クリック/バウンスをHonoに取り込める。コスト最優先ならAmazon SES($0.10/1,000通=月$3→$15)だが購読解除・抑制リスト・到達性監視の自前実装が必要。SendGridは無料枠廃止(60日トライアル化)でEssentials$19.95〜、Postmarkは月15万通で約$186と割高、Loops/Buttondownはニュースレター型でユーザー別パーソナライズに不向き。法対応: Gmail/Yahooガイドライン(2024年2月〜)で日次5,000通到達時にSPF+DKIM+DMARC+RFC8058ワンクリック解除が必須のため最初から実装する。特定電子メール法では有料会員=取引関係者でオプトイン例外だが、登録時同意取得+送信者名/住所/問合せ先/解除導線の表示+同意記録保存(最終送信から1か月)が安全。docomoは2025年2月からDMARC未対応送信者に警告表示するためDMARC必須。開封率はApple MPPで過大計測されるためクリック率主軸のKPI設計を推奨。

# verified_facts
- [NG] Amazon SESの送信料金は$0.10/1,000通で、月3万通=$3.00、月15万通=$15.00(無料枠は新規12か月間・月3,000通まで) => 訂正: 送信料金$0.10/1,000通、月3万通=$3.00、月15万通=$15.00は正確(基本送信料のみ。添付データは別途$0.12/GB)。ただし無料枠の記述は古い: AWS Free Tierは2025年7月15日に制度変更され、同日以降に作成された新規アカウントは従来の「12か月間・月3,000通」枠の対象外で、代わりにクレジット制(最大$200、無料アカウントプランは最長6か月)が適用される。「12か月間・月3,000メッセージチャージ無料」のレガシー枠が有効なのは2025年7月15日より前に作成されたアカウントのみ。また正確には「3,000通」ではなく「3,000メッセージチャージ」で、送信・受信・Virtual Deliverability Manager処理分(有効時は1通=2チャージ)を合算してカウントされる。
- [OK] Resend Proは$20/月で50,000通、$35/月で100,000通(超過$0.90/1,000通)。月15万通なら約$80/月
- [OK] Resendは東京リージョン(ap-northeast-1)での送信に対応(ただしデータ保存は米国)
- [OK] SendGridは恒久無料プランを廃止し60日トライアル(100通/日)に変更。Essentials $19.95/月(50k通)〜、Pro $89.95/月(100k通)〜
- [OK] Gmailは1日5,000通以上の大量送信者にSPF+DKIM+DMARC+RFC 8058ワンクリック購読解除を必須化(2024年2月施行)、迷惑メール率0.3%未満維持が必要 => 訂正: 主張は正確だが精緻化すると: (1) ワンクリック購読解除の完全適用期限は2024年6月1日まで猶予され、対象はマーケティング/購読型メールのみ(トランザクションメールは対象外)。(2) 迷惑メール率は「0.3%未満」で概ね正しいが、公式の正確な表現は「0.10%未満に維持し、0.30%以上に決して達しないこと」。(3) 要件はGmail個人アカウント宛て送信に適用(Google Workspaceアカウント宛ては対象外)。(4) 2025年11月以降、非準拠メールの一時的/恒久的な拒否など執行が段階的に強化されている。

# report
# メール配信基盤 調査レポート(2026年7月時点)

## 1. 各サービスの料金・特徴(公式ページ確認済み)

### Resend ([公式料金](https://resend.com/pricing))
- Free: $0、3,000通/月(100通/日)、ドメイン1個
- **Pro: $20/月で50,000通、$35/月で100,000通**。超過 $0.90/1,000通。ドメイン10個、日次上限なし
- Scale: $90/月(100k)〜$160/月(200k)〜。専用IP $30/月(Scale以上)
- マーケティング(Broadcasts)は連絡先数課金: Free 1,000контакт、$40/月で5,000契約者〜
- **東京リージョン(ap-northeast-1)で送信可能**。アジア向け到達時間を改善([Resendブログ](https://resend.com/blog/improving-time-to-inbox-in-asia)、[リージョン選択](https://resend.com/docs/dashboard/domains/regions))。ただしデータ保存自体は米国
- react-email と同一チームが開発しており親和性が最も高い

### Amazon SES ([公式料金](https://aws.amazon.com/ses/pricing/))
- **送信 $0.10/1,000通**(圧倒的最安)。添付データ $0.12/GB
- 無料枠: 新規顧客は最初の12か月間、月3,000メッセージまで無料
- 専用IP: 標準 $24.95/月、マネージド $15/月+従量
- Virtual Deliverability Manager(到達性ダッシュボード): $0.07/1,000通(〜10M)
- 注意: サンドボックス解除申請が必要。バウンス/苦情処理・購読解除管理・レピュテーション監視は自前実装(SNS/Webhook経由)。東京リージョン利用可

### SendGrid (Twilio) ([公式料金](https://www.twilio.com/en-us/products/email-api/pricing))
- **恒久無料プランは廃止され、60日間トライアル(100通/日)に変更**(2025年)([SendX解説](https://www.sendx.io/blog/sendgrid-pricing))
- Essentials: **$19.95/月〜(50,000通/月〜)**、超過 $0.0013〜0.0009/通
- Pro: **$89.95/月〜(100,000通/月〜)**、専用IP付き
- Premier: カスタム(5M通/月以上)
- 日本では構造計画研究所(KKE)経由の国内代理店サポートあり

### Postmark ([公式料金](https://postmarkapp.com/pricing))
- 2026年に料金再編: **Basic $15/月、Pro $16.50/月、Platform $18/月(いずれも10,000通/月込み)**
- 超過: Basic $1.80、Pro $1.30、Platform $1.20 /1,000通 → ボリュームが増えると割高
- 専用IP $50/月〜(30万通/月以上が条件)。DMARCモニタリング $14/月〜
- トランザクションメール到達率の評判は業界最高クラスだが、月15万通では約$186〜199と高コスト

### Mailgun ([公式料金](https://www.mailgun.com/pricing/))
- Free: 100通/日。Basic: $15/月(10,000通)
- Foundation: **$35/月(50,000通)**、超過 $1.30/1,000
- Scale: **$90/月(100,000通、専用IP1個込み)**、超過 $1.10/1,000。ログ保持30日

### Loops ([公式料金](https://loops.so/pricing))
- 契約者数課金。Free: 1,000契約者・4,000通/月まで
- 有料プランは**送信数無制限(トランザクションメール込み)**で契約者数のみ課金。目安 $49/月(5,000契約者)、$99/月(10,000契約者)([第三者調査](https://thatmarketingbuddy.com/pricing/loops)。公式はスライダー表示のみ)
- SaaS向けマーケメール+トランザクションの統合型。個別パーソナライズはテンプレ変数で対応

### Buttondown ([公式料金](https://buttondown.com/pricing))
- 100購読者まで無料。**Basic $9/月(1,000購読者)、$29/月(5,000購読者)**+機能別アドオン($9〜79/月)([料金解説](https://yoursolopreneurkit.com/blog/buttondown-pricing-2026))
- 「全員に1日1通まで」前提の純ニュースレター基盤。**ユーザーごとに内容が異なるパーソナライズドダイジェストには不向き**

## 2. 月間コスト試算(税抜USD、参考換算は$1=150円と仮定)

### 1,000ユーザー×毎日1通=月30,000通
| サービス | 月額 | 備考 |
|---|---|---|
| Amazon SES | **$3.00 (約450円)** | 30×$0.10。無料枠中なら約$2.7 |
| Buttondown Basic | $9 | ただしパーソナライズ不可 |
| Postmark Pro | $42.50 | $16.50+20k超過×$1.30 |
| SendGrid Essentials | $19.95 | 50k枠内 |
| **Resend Pro** | **$20 (約3,000円)** | 50k枠内、Tokyo region |
| Mailgun Foundation | $35 | 50k枠内 |
| Loops | 約$49 | 送信数無制限 |

### 5,000ユーザー×毎日1通=月150,000通
| サービス | 月額 | 備考 |
|---|---|---|
| Amazon SES | **$15 (約2,250円)** | 150×$0.10 |
| Buttondown | $29〜 | 5,000購読者(不向き) |
| Loops | 約$49 | 5,000契約者・無制限送信 |
| **Resend** | **$80** | Pro $35(100k)+50k×$0.90。Scale $160(200k)も選択可 |
| SendGrid Pro | $89.95〜 | 100k起点+従量(目安$90〜120) |
| Mailgun Scale | $145 | $90+50k×$1.10 |
| Postmark Platform | 約$186 | $18+140k×$1.20 |

## 3. 到達率の考慮事項

### Gmail/Yahoo 大量送信者ガイドライン(必須対応)
- **Gmail([公式](https://support.google.com/a/answer/81126))**: 2024年2月1日施行。全送信者にSPFまたはDKIM+TLS+迷惑メール率0.3%未満(推奨0.1%未満)。**1日5,000通以上の大量送信者はSPF・DKIM両方+DMARC(p=none以上)+From整合+RFC 8058ワンクリック購読解除(`List-Unsubscribe`/`List-Unsubscribe-Post`ヘッダー)+本文内の購読解除リンク**が必須
- **Yahoo([公式](https://senders.yahooinc.com/best-practices/))**: 同等要件。購読解除は**2日以内に処理**
- 本アプリは5,000ユーザー到達時に日次5,000通=大量送信者基準に該当。**最初からDMARC+ワンクリック解除を実装しておくべき**

### 日本のキャリアメール(docomo/au/softbank)
- ドコモメールは2025年2月より**DMARC quarantineポリシー準拠+なりすまし警告表示**(DMARC未対応/認証失敗の差出人に警告)([Synergy案内](https://www.synergy-marketing.co.jp/cloud/synergylead/support/news-20240906-docomo-anti-phishing/)、[ベアメール](https://baremail.jp/blog/2021/03/19/1192/))
- 3キャリアともSPF/DKIM/DMARC全設定が事実上必須。キャリア独自フィルタが厳しく、バウンスした宛先の速やかな除去と「受信許可リスト登録」の案内が有効([迷惑メール相談センター](https://www.dekyo.or.jp/soudan/contents/taisaku/2-2filter.html))
- 有料テック系SaaSの利用者はGmail等が大半と想定されるため、キャリアメール登録は非推奨とする(登録時に警告表示)のが現実的

## 4. 特定電子メール法(日本)の要件

出典: [迷惑メール相談センター](https://www.dekyo.or.jp/soudan/contents/taisaku/1-2.html)、[総務省](https://www.soumu.go.jp/main_sosiki/joho_tsusin/d_syohi/m_mail.html)、[e-Gov法令](https://laws.e-gov.go.jp/law/414AC0100000026)

- **オプトイン規制**: 広告宣伝メールは原則事前同意が必要。例外は①名刺等で自己のアドレスを通知した者、②**取引関係にある者**、③Webサイトでアドレスを公表している団体・営業を営む個人([解説](https://blastmail.jp/blog/mailmagazine/mail-law))
- **有料会員向け配信の扱い**: 会員は「取引関係にある者」に該当し、かつユーザーが自ら申し込んだダイジェスト(役務の提供内容そのもの)は広告宣伝が主目的でなければ特定電子メールに該当しない可能性が高い。ただし自社プランのアップセルや広告枠を載せると特定電子メールになるため、**登録時に配信同意を明示取得するのが安全**
- **表示義務**: 本文に(1)送信者の氏名/名称、(2)受信拒否用のメールアドレスまたはURL(+直前直後に拒否通知可能である旨)。リンク先表示可の項目として(3)送信者住所、(4)苦情・問合せ受付先
- **同意記録の保存**: 広告宣伝メールを最後に送信した日から1か月間保存(措置命令を受けた場合は最長1年)(施行規則、[解説](https://houritsushoku.com/archives/obligation-on-specified-email-senders-to-preserve-evidence-of-consent-in-opt-in-regulations.html))
- **罰則**: 送信者情報偽装や措置命令違反は1年以下の拘禁刑または100万円以下の罰金(法人は3,000万円以下)

## 5. メールテンプレート開発: react-email

- [react-email](https://react.email/): OSS(GitHub 19.4k stars)。React+TypeScript+TailwindでメールHTMLを生成。Body/Button/Heading/Text等のコンポーネント、Gmail/Outlook/Apple Mail互換性チェッカー、スパムスコア分析、リンクLinter内蔵
- **Resend/SendGrid/Mailgun/SES/Postmarkすべてに送信可能**(レンダリング結果のHTMLを各SDKに渡すだけ)。Next.js+TypeScript構成と完全に一致し、ダイジェストのパーソナライズ(propsで記事リスト注入)に最適

## 6. 開封率・クリック率トラッキング

- **Resend**([公式docs](https://resend.com/docs/dashboard/domains/tracking)): ドメイン単位で有効化。開封=1x1透過GIF、クリック=リンクをトラッキングサブドメイン(CNAME設定、例 links.example.com)経由に書き換え。`email.opened`/`email.clicked` Webhookで自前DBに記録可能
- **Amazon SES**([公式docs](https://docs.aws.amazon.com/ses/latest/dg/monitor-using-event-publishing.html)): Configuration Set+イベントパブリッシング(SNS/Firehose/CloudWatch)でsend/delivery/open/click/bounce/complaintを取得。SNS→Lambda/Webhook→DBの構成
- 注意: Apple Mail Privacy Protectionにより開封率は過大計測される。KPIはクリック率(記事リンク)を主軸にし、クリックはトラッキングURL経由で確実に計測するのが推奨

## 7. 推奨構成

**推奨: Resend Pro($20/月)+react-email+ワンクリック解除ヘッダー自前付与**
- 理由: (1)東京リージョンで国内到達が速い、(2)react-emailネイティブでNext.js/TS/Honoスタックと開発体験が一致、(3)Webhookで開封/クリック/バウンスをHono APIに流し込みやすい、(4)1,000ユーザー時$20/月、5,000ユーザー時$80/月と予算内、(5)ダッシュボードでログ確認可能(30日保持)
- 実装必須事項: SPF/DKIM/DMARC(最初はp=none→運用安定後quarantine)、`List-Unsubscribe`+`List-Unsubscribe-Post`ヘッダー、フッターに事業者名/住所/問合せ先/解除リンク、登録フローで配信同意チェックボックス+同意日時のDB記録、バウンス/苦情Webhookで自動配信停止
- **コスト最優先の代替: Amazon SES(月$3→$15)**。ただし購読解除管理・抑制リスト・到達性監視の自前実装で開発工数+1〜2週間相当。5,000ユーザー超で月額差($65/月〜)が工数に見合うようになったら移行を検討(送信部を抽象化しておけば移行容易)
- Postmarkは到達率最重視なら候補だが月15万通で$186と割高。Loops/Buttondownはニュースレター型でパーソナライズドダイジェストに不適合
