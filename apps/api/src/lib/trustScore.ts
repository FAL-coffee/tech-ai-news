import { isMajorCompanyDomain } from "./majorCompanyDomains";

export interface TrustScoreInput {
  domain: string;
  discoveryCount: number;
  detectedFeedUrl: string | null;
}

const MAJOR_COMPANY_POINTS = 50;
const FEED_DETECTED_POINTS = 30;
const DISCOVERY_COUNT_POINTS_PER_HIT = 2;
const DISCOVERY_COUNT_POINTS_CAP = 20;

/**
 * 収集先候補の信頼度スコア(0-100)。
 * - 大手企業の公式ドメイン一致: +50(isMajorCompanyDomain参照)
 * - フィード自動検出済み: +30(実際に配信中のRSS/Atomがある = 実体のある発信元である可能性が高い)
 * - Hacker Newsでの発見回数: 1回あたり+2、最大+20(繰り返し話題になる=単発の跳ねたブログ記事ではない可能性が高い)
 *
 * 自動承認(AUTO_APPROVE_THRESHOLD)に届くのは「大手企業ドメイン一致 かつ フィード検出済み」の
 * 組み合わせのみ(50+30=80)。発見回数だけでは最大50点にしかならず自動承認には届かない
 * (話題になった個人ブログ等を自動承認してしまう事故を防ぐため)。
 */
export function computeTrustScore(input: TrustScoreInput): number {
  let score = 0;
  if (isMajorCompanyDomain(input.domain)) score += MAJOR_COMPANY_POINTS;
  if (input.detectedFeedUrl) score += FEED_DETECTED_POINTS;
  score += Math.min(DISCOVERY_COUNT_POINTS_CAP, input.discoveryCount * DISCOVERY_COUNT_POINTS_PER_HIT);
  return Math.min(100, score);
}

export const AUTO_APPROVE_TRUST_SCORE_THRESHOLD = 80;

export function isAutoApprovable(input: TrustScoreInput): boolean {
  return computeTrustScore(input) >= AUTO_APPROVE_TRUST_SCORE_THRESHOLD;
}
