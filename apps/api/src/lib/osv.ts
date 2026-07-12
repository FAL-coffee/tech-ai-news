interface OsvSeverity {
  type: string;
  score: string;
}

interface OsvVuln {
  id: string;
  summary?: string;
  details?: string;
  published?: string;
  severity?: OsvSeverity[];
  database_specific?: { severity?: string };
}

export interface VulnerabilityMatch {
  osvId: string;
  summary: string;
  severity: string | null;
  detailsUrl: string;
  publishedAt: string | null;
}

/** CVSSベクタ文字列(例: "CVSS:3.1/AV:N/AC:L/...")から大まかな深刻度ラベルを抜き出す。判定できなければnull。 */
function severityLabel(vuln: OsvVuln): string | null {
  if (vuln.database_specific?.severity) return vuln.database_specific.severity;
  return vuln.severity?.[0]?.score ?? null;
}

/**
 * OSV.dev(https://osv.dev)へパッケージ名+エコシステムで問い合わせる。認証不要の公開API。
 * バージョン指定なしで問い合わせると、そのパッケージの既知の脆弱性が全件返るため、
 * 呼び出し側で publishedSinceDate によって直近のものだけに絞り込むこと
 * (絞り込まないと初回実行時に過去の全CVEを「新規アラート」として大量送信してしまう)。
 */
export async function queryOsvForPackage(
  ecosystem: string,
  packageName: string,
  publishedSinceDate: string,
): Promise<VulnerabilityMatch[]> {
  const res = await fetch("https://api.osv.dev/v1/query", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ package: { name: packageName, ecosystem } }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    throw new Error(`osv.dev query failed for ${ecosystem}/${packageName}: ${res.status}`);
  }

  const data = (await res.json()) as { vulns?: OsvVuln[] };
  const cutoff = new Date(publishedSinceDate).getTime();

  return (data.vulns ?? [])
    .filter((v) => v.published && new Date(v.published).getTime() >= cutoff)
    .map((v) => ({
      osvId: v.id,
      summary: v.summary ?? v.details?.slice(0, 300) ?? "詳細はリンク先を参照してください。",
      severity: severityLabel(v),
      detailsUrl: `https://osv.dev/vulnerability/${v.id}`,
      publishedAt: v.published ?? null,
    }));
}
