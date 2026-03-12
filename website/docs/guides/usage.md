---
title: Usage Guide
sidebar_position: 7
---

# Usage Guide

The `usage` module queries and trims RGW usage logs:

- retrieve usage reports (per-user or cluster-wide)
- trim (delete) usage log entries

:::info
Usage logging must be enabled in your Ceph config: `rgw enable usage log = true`
:::

API reference: [Usage types and methods](../api/classes/RadosGWAdminClient)

## Prerequisites

```ts
import { RadosGWAdminClient } from 'radosgw-admin';

const rgw = new RadosGWAdminClient({
  host: 'https://ceph-rgw.example.com',
  accessKey: process.env.RGW_ADMIN_ACCESS_KEY!,
  secretKey: process.env.RGW_ADMIN_SECRET_KEY!,
});
```

## 1) Get Usage Report

### Cluster-wide, all time

```ts
const all = await rgw.usage.get();
console.log('Entries:', all.entries.length);
console.log('Summary:', all.summary.length);
```

### Single user with date range

```ts
const report = await rgw.usage.get({
  uid: 'alice',
  start: '2025-01-01',
  end: '2025-01-31',
});

for (const s of report.summary) {
  console.log(s.user, 'sent', s.total.bytesSent, 'bytes');
}
```

### Control what's returned

```ts
// Summary only (lighter response)
const summaryOnly = await rgw.usage.get({
  uid: 'alice',
  showEntries: false,
  showSummary: true,
});

// Entries only (per-bucket detail)
const entriesOnly = await rgw.usage.get({
  uid: 'alice',
  showEntries: true,
  showSummary: false,
});
```

### Date formats

Dates accept `string` or `Date` objects:

```ts
// String format
await rgw.usage.get({ start: '2025-01-01', end: '2025-01-31' });

// Date objects
await rgw.usage.get({
  start: new Date('2025-01-01'),
  end: new Date('2025-01-31'),
});
```

## 2) Trim Usage Logs

### Trim a specific user's logs

```ts
await rgw.usage.trim({
  uid: 'alice',
  end: '2024-12-31',
});
```

### Trim all logs cluster-wide

```ts
await rgw.usage.trim({
  end: '2023-12-31',
  removeAll: true,
});
```

:::warning
`removeAll: true` is required when trimming without a `uid`. This safety guard prevents accidental cluster-wide log deletion.
:::

## Usage Report Structure

```ts
const report = await rgw.usage.get({ uid: 'alice' });

// entries — per-bucket breakdown
for (const entry of report.entries) {
  console.log('User:', entry.user);
  for (const bucket of entry.buckets) {
    console.log('  Bucket:', bucket.bucket);
    for (const cat of bucket.categories) {
      console.log('    Category:', cat.category);
      console.log('    Ops:', cat.successfulOps);
      console.log('    Bytes sent:', cat.bytesSent);
    }
  }
}

// summary — per-user totals
for (const s of report.summary) {
  console.log(s.user, '—', s.total.successfulOps, 'ops');
}
```

## Billing Report Pattern

Build a monthly billing report:

```ts
async function monthlyReport(uid: string, year: number, month: number) {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  const end = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;

  const report = await rgw.usage.get({
    uid,
    start,
    end,
    showSummary: true,
    showEntries: false,
  });

  return {
    uid,
    period: `${start} to ${end}`,
    totalOps: report.summary[0]?.total.ops ?? 0,
    bytesSent: report.summary[0]?.total.bytesSent ?? 0,
    bytesReceived: report.summary[0]?.total.bytesReceived ?? 0,
  };
}
```

## Error Handling

```ts
import { RGWValidationError } from 'radosgw-admin';

try {
  await rgw.usage.trim({ end: '2024-12-31' });
} catch (error) {
  if (error instanceof RGWValidationError) {
    // Missing removeAll:true, empty uid, or invalid date format
  } else {
    throw error;
  }
}
```

## Production Notes

1. Usage logging must be enabled in `ceph.conf` (`rgw enable usage log = true`).
2. Trim old logs periodically to prevent unbounded growth of the usage log OMAP.
3. Querying large date ranges with `showEntries: true` can return very large responses. Use `showSummary: true` for lighter payloads.
4. A non-existent user returns an empty report (no error), so check `summary.length`.
5. Inverted date ranges (start > end) return empty results silently. The SDK warns in the console but does not throw.
