[**radosgw-admin**](../README.md)

***

# Interface: GetUsageInput

Defined in: src/types/usage.types.ts:3

## Properties

### end?

> `optional` **end**: `string` \| `Date`

Defined in: src/types/usage.types.ts:9

End of the date range. Accepts ISO date string ("2024-01-31") or Date object.

***

### showEntries?

> `optional` **showEntries**: `boolean`

Defined in: src/types/usage.types.ts:11

Include per-bucket usage entries in the response. Default: true.

***

### showSummary?

> `optional` **showSummary**: `boolean`

Defined in: src/types/usage.types.ts:13

Include per-user summary totals in the response. Default: true.

***

### start?

> `optional` **start**: `string` \| `Date`

Defined in: src/types/usage.types.ts:7

Start of the date range. Accepts ISO date string ("2024-01-01") or Date object.

***

### uid?

> `optional` **uid**: `string`

Defined in: src/types/usage.types.ts:5

Filter by user ID. Omit to retrieve cluster-wide usage for all users.
