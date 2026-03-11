[**radosgw-admin**](../README.md)

***

# Interface: SetUserRateLimitInput

Defined in: src/types/quota.types.ts:44

Input for setting a user-level rate limit.

## Properties

### enabled?

> `optional` **enabled**: `boolean`

Defined in: src/types/quota.types.ts:56

Whether the rate limit is enabled. Default: true.

***

### maxReadBytes?

> `optional` **maxReadBytes**: `number`

Defined in: src/types/quota.types.ts:52

Max read bytes per minute per RGW instance. 0 = unlimited.

***

### maxReadOps?

> `optional` **maxReadOps**: `number`

Defined in: src/types/quota.types.ts:48

Max read ops per minute per RGW instance. 0 = unlimited.

***

### maxWriteBytes?

> `optional` **maxWriteBytes**: `number`

Defined in: src/types/quota.types.ts:54

Max write bytes per minute per RGW instance. 0 = unlimited.

***

### maxWriteOps?

> `optional` **maxWriteOps**: `number`

Defined in: src/types/quota.types.ts:50

Max write ops per minute per RGW instance. 0 = unlimited.

***

### uid

> **uid**: `string`

Defined in: src/types/quota.types.ts:46

User ID. Required.
