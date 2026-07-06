export type SourceKind = "rss" | "atom" | "github_releases" | "bluesky" | "newsletter" | "manual";

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  url: string;
  etag: string | null;
  lastModified: string | null;
  fetchIntervalMin: number;
  lastFetchedAt: string | null;
  enabled: boolean;
  createdAt: string;
}

export type RawItemStatus = "new" | "selected" | "skipped" | "generated";

export interface RawItem {
  id: string;
  sourceId: string;
  externalUrl: string;
  title: string;
  contentText: string | null;
  contentHash: string;
  publishedAt: string | null;
  fetchedAt: string;
  status: RawItemStatus;
  importance: number | null;
  topics: string[] | null;
  lastError: string | null;
}

export interface Topic {
  id: string;
  slug: string;
  nameJa: string;
  nameEn: string;
}

export interface Article {
  id: string;
  rawItemId: string | null;
  slug: string;
  titleJa: string;
  titleEn: string;
  summaryJa: string;
  summaryEn: string;
  bodyJa: string;
  bodyEn: string;
  originalUrl: string;
  sourceName: string;
  importance: number;
  model: string;
  publishedAt: string;
  status: "draft" | "published" | "retracted";
  topics?: string[];
}

export type Lang = "ja" | "en";

export type SubscriptionStatus =
  | "none"
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused";

export interface Subscription {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  plan: string;
  currentPeriodEnd: string | null;
}
