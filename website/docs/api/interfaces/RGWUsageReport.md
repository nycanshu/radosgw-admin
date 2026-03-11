[**radosgw-admin**](../README.md)

***

# Interface: RGWUsageReport

Defined in: src/types/usage.types.ts:72

## Properties

### entries

> **entries**: [`RGWUsageEntry`](RGWUsageEntry.md)[]

Defined in: src/types/usage.types.ts:74

Detailed per-bucket usage entries (present when showEntries is true).

***

### summary

> **summary**: [`RGWUsageSummary`](RGWUsageSummary.md)[]

Defined in: src/types/usage.types.ts:76

Per-user aggregated summaries (present when showSummary is true).
