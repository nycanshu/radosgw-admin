import type { BaseClient } from '../client.js';
import { RGWValidationError } from '../errors.js';
import type { GetUsageInput, TrimUsageInput, RGWUsageReport } from '../types/usage.types.js';

/**
 * Normalises a `string | Date` to a `YYYY-MM-DD` string that RGW accepts.
 * Throws `RGWValidationError` if the string is not a valid date.
 */
function normalizeDate(value: string | Date): string {
  if (value instanceof Date) {
    if (isNaN(value.getTime())) {
      throw new RGWValidationError('Invalid Date object provided for date range filter');
    }
    return value.toISOString().slice(0, 10);
  }

  // Accept "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"
  if (!/^\d{4}-\d{2}-\d{2}(?: \d{2}:\d{2}:\d{2})?$/.test(value.trim())) {
    throw new RGWValidationError(
      `Invalid date string: "${value}". Use "YYYY-MM-DD" or "YYYY-MM-DD HH:MM:SS"`,
    );
  }
  return value.trim();
}

/**
 * Usage & analytics module — query and trim RGW usage logs.
 *
 * > **Note:** Usage logging must be enabled in your Ceph config:
 * > `rgw enable usage log = true`
 *
 * @example
 * ```typescript
 * // Get usage for a specific user in January 2025
 * const report = await client.usage.get({
 *   uid: 'alice',
 *   start: '2025-01-01',
 *   end: '2025-01-31',
 * });
 *
 * // Trim all usage logs before a date (cluster-wide)
 * await client.usage.trim({ end: '2024-12-31', removeAll: true });
 * ```
 */
export class UsageModule {
  constructor(private readonly client: BaseClient) {}

  /**
   * Retrieve a usage report for a user or the entire cluster.
   *
   * Omit `uid` to get cluster-wide usage across all users.
   * Omit `start`/`end` to get all available usage data.
   *
   * > **Note:** Usage logging must be enabled in `ceph.conf`:
   * > `rgw enable usage log = true`
   *
   * @param input - Optional filters: `uid`, `start`, `end`, `showEntries`, `showSummary`.
   * @returns A usage report with `entries` (per-bucket detail) and `summary` (per-user totals).
   * @throws {RGWValidationError} If a date string is not in a recognised format.
   *
   * @example
   * ```typescript
   * // Cluster-wide usage, all time
   * const all = await client.usage.get();
   *
   * // Single user, date range
   * const report = await client.usage.get({
   *   uid: 'alice',
   *   start: '2025-01-01',
   *   end: '2025-01-31',
   * });
   *
   * for (const s of report.summary) {
   *   console.log(s.user, 'sent', s.total.bytesSent, 'bytes');
   * }
   * ```
   */
  async get(input: GetUsageInput = {}): Promise<RGWUsageReport> {
    const start = input.start !== undefined ? normalizeDate(input.start) : undefined;
    const end = input.end !== undefined ? normalizeDate(input.end) : undefined;

    return this.client.request<RGWUsageReport>({
      method: 'GET',
      path: '/usage',
      query: {
        uid: input.uid,
        start,
        end,
        showEntries: input.showEntries,
        showSummary: input.showSummary,
      },
    });
  }

  /**
   * Delete (trim) usage log entries matching the given filters.
   *
   * **Destructive operation** — deleted log entries cannot be recovered.
   *
   * When no `uid` is provided the trim applies cluster-wide. In that case
   * `removeAll: true` is required to prevent accidental full-cluster log wipes.
   *
   * @param input - Trim filters. Omit entirely to trim nothing (use `removeAll: true` explicitly).
   * @throws {RGWValidationError} If `uid` is omitted but `removeAll` is not `true`.
   * @throws {RGWValidationError} If a date string is not in a recognised format.
   *
   * @example
   * ```typescript
   * // Trim a specific user's logs up to end of 2024
   * await client.usage.trim({ uid: 'alice', end: '2024-12-31' });
   *
   * // ⚠️  Trim all logs before 2024 across the entire cluster
   * await client.usage.trim({ end: '2023-12-31', removeAll: true });
   * ```
   */
  async trim(input: TrimUsageInput = {}): Promise<void> {
    if (!input.uid && input.removeAll !== true) {
      throw new RGWValidationError(
        'trim() without a uid removes logs for ALL users. Set removeAll: true to confirm.',
      );
    }

    if (input.removeAll) {
      console.warn(
        '[radosgw-admin] WARNING: usage.trim() with removeAll=true will permanently delete usage logs' +
          (input.uid ? ` for user "${input.uid}"` : ' for ALL users'),
      );
    }

    const start = input.start !== undefined ? normalizeDate(input.start) : undefined;
    const end = input.end !== undefined ? normalizeDate(input.end) : undefined;

    return this.client.request<void>({
      method: 'DELETE',
      path: '/usage',
      query: {
        uid: input.uid,
        start,
        end,
        removeAll: input.removeAll,
      },
    });
  }
}
