[**radosgw-admin**](../README.md)

***

# Interface: SetBucketQuotaInput

Defined in: src/types/quota.types.ts:19

Input for setting a bucket-level quota.

## Properties

### enabled?

> `optional` **enabled**: `boolean`

Defined in: src/types/quota.types.ts:27

Whether the quota is enabled. Default: true when setting a quota.

***

### maxObjects?

> `optional` **maxObjects**: `number`

Defined in: src/types/quota.types.ts:25

Maximum number of objects. -1 for unlimited.

***

### maxSize?

> `optional` **maxSize**: `string` \| `number`

Defined in: src/types/quota.types.ts:23

Maximum storage size in bytes, or a human-readable string like "10G", "500M". -1 for unlimited.

***

### uid

> **uid**: `string`

Defined in: src/types/quota.types.ts:21

User ID. Required.
