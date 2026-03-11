[**radosgw-admin**](../README.md)

***

# Interface: RGWUsageSummary

Defined in: src/types/usage.types.ts:58

## Properties

### categories

> **categories**: [`RGWUsageCategory`](RGWUsageCategory.md)[]

Defined in: src/types/usage.types.ts:62

Per-category totals for this user.

***

### total

> **total**: `object`

Defined in: src/types/usage.types.ts:64

Aggregate totals across all categories for this user.

#### bytesReceived

> **bytesReceived**: `number`

#### bytesSent

> **bytesSent**: `number`

#### ops

> **ops**: `number`

#### successfulOps

> **successfulOps**: `number`

***

### user

> **user**: `string`

Defined in: src/types/usage.types.ts:60

The user ID this summary belongs to.
