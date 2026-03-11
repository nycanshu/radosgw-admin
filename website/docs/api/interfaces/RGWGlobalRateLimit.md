[**radosgw-admin**](../README.md)

***

# Interface: RGWGlobalRateLimit

Defined in: src/types/quota.types.ts:92

Global rate limit info returned by the RGW Admin API.

## Properties

### anonymous

> **anonymous**: [`RGWRateLimit`](RGWRateLimit.md)

Defined in: src/types/quota.types.ts:98

Rate limit for anonymous (unauthenticated) access.

***

### bucket

> **bucket**: [`RGWRateLimit`](RGWRateLimit.md)

Defined in: src/types/quota.types.ts:96

Rate limit for all buckets (per-bucket scope).

***

### user

> **user**: [`RGWRateLimit`](RGWRateLimit.md)

Defined in: src/types/quota.types.ts:94

Rate limit for all users (per-user scope).
