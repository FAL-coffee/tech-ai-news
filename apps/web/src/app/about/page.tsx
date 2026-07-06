import Link from "next/link";

export const metadata = { title: "サービス概要" };

export default function AboutPage() {
  return (
    <main className="page">
      <div className="header">
        <h1 className="hero-title">サービス概要</h1>
      </div>

      <div className="legal-body">
        <h2>tech/ai newsとは</h2>
        <p>
          tech/ai newsは、海外テック企業の公式ブログや公式アカウント、開発者向けリリースノートなど「一次情報」だけを収集し、AIが日本語記事として再構成してお届けするニュースサービスです。まとめサイトや二次情報の転載ではなく、常に原文にリンクをたどれることを重視しています。
        </p>
        <p>
          英語で発信される最新情報を、要点を押さえた読みやすい日本語記事にすることで、忙しい方でも短時間でテック/AI業界の動きを追えるようにすることを目指しています。
        </p>

        <h2>主な機能</h2>
        <ul>
          <li>
            <strong>一次情報の記事化</strong>
            ―公式ブログ・GitHub Releases・公式SNSアカウントなどから収集した情報を、AIが要点を抽出し独自の日本語記事として書き起こします。
          </li>
          <li>
            <strong>ワンポイント解説(ハイライト)</strong>
            ―記事ごとに「この記事の何が便利/重要なのか」を一言で示すハイライトを表示します。
          </li>
          <li>
            <strong>トピック別の絞り込み・メールダイジェスト</strong>
            ―興味のあるトピックを選択すると、新着記事をメールでもお届けします。
          </li>
          <li>
            <strong>いいね・ブックマーク</strong>
            ―気になった記事にいいねをつけたり、後で読み返せるようブックマークできます。
          </li>
        </ul>

        <h2>記事について</h2>
        <p>
          掲載記事はAI(大規模言語モデル)が原文の事実を抽出し、独自の言葉で再構成したものです。原文の要約や翻訳ではなく、あくまで「元記事を読むきっかけとなる記事」として作成しており、原文の完全な代替とはなりません。各記事には出典(元記事のURL)を必ず明記しています。内容の正確性については万全を尽くしていますが、詳細や最新の情報については必ず出典元の原文もご確認ください。
        </p>

        <h2>運営情報</h2>
        <table className="legal-table">
          <tbody>
            <tr>
              <th>サービス名</th>
              <td>tech/ai news</td>
            </tr>
            <tr>
              <th>運営者</th>
              <td>福留隼翔</td>
            </tr>
            <tr>
              <th>お問い合わせ</th>
              <td>
                <a href="mailto:fal.engineer.2001@gmail.com">fal.engineer.2001@gmail.com</a>
              </td>
            </tr>
          </tbody>
        </table>

        <h2>関連ページ</h2>
        <ul className="legal-links">
          <li>
            <Link href="/terms">利用規約</Link>
          </li>
          <li>
            <Link href="/privacy">プライバシーポリシー</Link>
          </li>
          <li>
            <Link href="/tokushoho">特定商取引法に基づく表記</Link>
          </li>
          <li>
            <Link href="/pricing">料金プラン</Link>
          </li>
        </ul>
      </div>
    </main>
  );
}
