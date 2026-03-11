[**radosgw-admin**](../README.md)

***

# Interface: SetBucketRateLimitInput

Defined in: src/types/quota.types.ts:60

Input for setting a bucket-level rate limit.

## Properties

### bucket

> **bucket**: `string`

Defined in: src/types/quota.types.ts:62

Bucket name. Required.

***

### enabled?

> `optional` **enabled**: `boolean`

Defined in: src/types/quota.types.ts:72

Whether the rate limit is enabled. Default: true.

***

### maxReadBytes?

> `optional` **maxReadBytes**: `number`

Defined in: src/types/quota.types.ts:68

Max read bytes per minute per RGW instance. 0 = unlimited.

***

### maxReadOps?

> `optional` **maxReadOps**: `number`

Defined in: src/types/quota.types.ts:64

Max read ops per minute per RGW instance. 0 = unlimited.

***

### maxWriteBytes?

> `optional` **maxWriteBytes**: `number`

Defined in: src/types/quota.types.ts:70

Max write bytes per minute per RGW instance. 0 = unlimited.

***

### maxWriteOps?

> `optional` **maxWriteOps**: `number`

Defined in: src/types/quota.types.ts:66

Max write ops per minute per RGW instance. 0 = unlimited.
