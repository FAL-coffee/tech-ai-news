export const metadata = { title: "特定商取引法に基づく表記" };

export default function TokushohoPage() {
  return (
    <main className="page">
      <div className="header">
        <h1 className="hero-title">特定商取引法に基づく表記</h1>
      </div>

      <div className="legal-body">
        <table className="legal-table">
          <tbody>
            <tr>
              <th>販売業者</th>
              <td>福留隼翔</td>
            </tr>
            <tr>
              <th>運営統括責任者</th>
              <td>福留隼翔</td>
            </tr>
            <tr>
              <th>所在地</th>
              <td>ご請求いただければ遅滞なく開示いたします。下記メールアドレスよりご連絡ください。</td>
            </tr>
            <tr>
              <th>電話番号</th>
              <td>ご請求いただければ遅滞なく開示いたします。下記メールアドレスよりご連絡ください。</td>
            </tr>
            <tr>
              <th>メールアドレス</th>
              <td>
                <a href="mailto:fal.engineer.2001@gmail.com">fal.engineer.2001@gmail.com</a>
              </td>
            </tr>
            <tr>
              <th>販売価格</th>
              <td>
                スタンダードプラン: ¥980/月(税込)。詳細は<a href="/pricing">料金プラン</a>ページをご確認ください。
              </td>
            </tr>
            <tr>
              <th>商品代金以外の必要料金</th>
              <td>本サービスの利用に必要となるインターネット接続料金・通信料等はお客様のご負担となります。</td>
            </tr>
            <tr>
              <th>お支払い方法</th>
              <td>クレジットカード決済(決済代行会社Stripe, Inc.を利用)</td>
            </tr>
            <tr>
              <th>お支払い時期</th>
              <td>有料プランへのご登録時に初回のお支払いが発生し、以降は毎月同日に自動的に更新・課金されます。</td>
            </tr>
            <tr>
              <th>サービスの提供時期</th>
              <td>お支払い完了後、直ちにご利用いただけます。</td>
            </tr>
            <tr>
              <th>返品・キャンセルについて</th>
              <td>
                本サービスはデジタルコンテンツであるため、提供開始後の返金は原則として行っておりません。有料プランはアカウントページからいつでも解約でき、解約手続きの完了後は次回の更新分から課金が停止します。
              </td>
            </tr>
            <tr>
              <th>動作環境</th>
              <td>最新版のGoogle Chrome、Safari、Firefox、Microsoft Edgeなど主要なWebブラウザ。</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
