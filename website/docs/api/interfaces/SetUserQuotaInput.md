[**radosgw-admin**](../README.md)

***

# Interface: SetUserQuotaInput

Defined in: src/types/quota.types.ts:7

Input for setting a user-level quota.

## Properties

### enabled?

> `optional` **enabled**: `boolean`

Defined in: src/types/quota.types.ts:15

Whether the quota is enabled. Default: true when setting a quota.

***

### maxObjects?

> `optional` **maxObjects**: `number`

Defined in: src/types/quota.types.ts:13

Maximum number of objects. -1 for unlimited.

***

### maxSize?

> `optional` **maxSize**: `string` \| `number`

Defined in: src/types/quota.types.ts:11

Maximum storage size in bytes, or a human-readable string like "10G", "500M". -1 for unlimited.

***

### uid

> **uid**: `string`

Defined in: src/types/quota.types.ts:9

User ID. Required.
