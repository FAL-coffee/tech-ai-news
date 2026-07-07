export type SourceKind = "rss" | "atom" | "github_releases" | "bluesky" | "newsletter" | "manual" | "hn_domain";

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
  title: string;
  summary: string;
  body: string;
  highlight: string;
  ogImageUrl: string | null;
  originalUrl: string;
  sourceName: string;
  importance: number;
  model: string;
  publishedAt: string;
  originalPublishedAt: string | null;
  status: "draft" | "published" | "retracted";
  topics?: string[];
}

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
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  status: SubscriptionStatus;
  plan: string;
  currentPeriodEnd: string | null;
}

export interface EmailPreference {
  userId: string;
  digestEnabled: boolean;
  consentAt: string | null;
  unsubscribeToken: string;
  createdAt: string;
  updatedAt: string;
}

export type CandidateStatus = "pending" | "approved" | "rejected";

export interface TrustedDomain {
  domain: string;
  note: string | null;
  createdAt: string;
}

export interface SourceCandidate {
  id: string;
  domain: string;
  discoveryCount: number;
  sampleUrls: string[];
  detectedFeedUrl: string | null;
  detectedFeedKind: "rss" | "atom" | null;
  trustScore: number;
  status: CandidateStatus;
  resultingSourceId: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}

export interface TopicCandidate {
  id: string;
  slug: string;
  nameJa: string;
  nameEn: string;
  reason: string | null;
  occurrenceCount: number;
  status: CandidateStatus;
  resultingTopicId: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
}
