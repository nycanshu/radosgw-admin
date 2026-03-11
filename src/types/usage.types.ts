// ── Usage report types ────────────────────────────────────────────────────────

export interface GetUsageInput {
  /** Filter by user ID. Omit to retrieve cluster-wide usage for all users. */
  uid?: string;
  /** Start of the date range. Accepts ISO date string ("2024-01-01") or Date object. */
  start?: string | Date;
  /** End of the date range. Accepts ISO date string ("2024-01-31") or Date object. */
  end?: string | Date;
  /** Include per-bucket usage entries in the response. Default: true. */
  showEntries?: boolean;
  /** Include per-user summary totals in the response. Default: true. */
  showSummary?: boolean;
}

export interface TrimUsageInput {
  /** Trim usage logs only for this user. Omit to trim across all users. */
  uid?: string;
  /** Start of the date range to trim. */
  start?: string | Date;
  /** End of the date range to trim. */
  end?: string | Date;
  /**
   * Required when `uid` is not provided to prevent accidental cluster-wide log deletion.
   * Setting this to `true` explicitly acknowledges that all matching logs will be removed.
   */
  removeAll?: boolean;
}

export interface RGWUsageCategory {
  /** Operation category, e.g. "get_obj", "put_obj", "delete_obj", "list_buckets". */
  category: string;
  /** Total bytes sent (egress) for this category. */
  bytesSent: number;
  /** Total bytes received (ingress) for this category. */
  bytesReceived: number;
  /** Total number of operations attempted. */
  ops: number;
  /** Total number of operations that succeeded. */
  successfulOps: number;
}

export interface RGWUsageBucket {
  bucket: string;
  time: string;
  epoch: number;
  owner: string;
  categories: RGWUsageCategory[];
}

export interface RGWUsageEntry {
  /** The user ID this entry belongs to. */
  user: string;
  /** Per-bucket breakdown of usage. */
  buckets: RGWUsageBucket[];
}

export interface RGWUsageSummary {
  /** The user ID this summary belongs to. */
  user: string;
  /** Per-category totals for this user. */
  categories: RGWUsageCategory[];
  /** Aggregate totals across all categories for this user. */
  total: {
    bytesSent: number;
    bytesReceived: number;
    ops: number;
    successfulOps: number;
  };
}

export interface RGWUsageReport {
  /** Detailed per-bucket usage entries (present when showEntries is true). */
  entries: RGWUsageEntry[];
  /** Per-user aggregated summaries (present when showSummary is true). */
  summary: RGWUsageSummary[];
}

// ── Cluster info types ────────────────────────────────────────────────────────

export interface RGWClusterInfo {
  info: {
    /** The Ceph cluster FSID (unique identifier for the cluster). */
    clusterId: string;
  };
}
