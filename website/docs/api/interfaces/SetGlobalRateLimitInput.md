[**radosgw-admin**](../README.md)

***

# Interface: SetGlobalRateLimitInput

Defined in: src/types/quota.types.ts:76

Input for setting a global rate limit.

## Properties

### enabled?

> `optional` **enabled**: `boolean`

Defined in: src/types/quota.types.ts:88

Whether the rate limit is enabled. Default: true.

***

### maxReadBytes?

> `optional` **maxReadBytes**: `number`

Defined in: src/types/quota.types.ts:84

Max read bytes per minute per RGW instance. 0 = unlimited.

***

### maxReadOps?

> `optional` **maxReadOps**: `number`

Defined in: src/types/quota.types.ts:80

Max read ops per minute per RGW instance. 0 = unlimited.

***

### maxWriteBytes?

> `optional` **maxWriteBytes**: `number`

Defined in: src/types/quota.types.ts:86

Max write bytes per minute per RGW instance. 0 = unlimited.

***

### maxWriteOps?

> `optional` **maxWriteOps**: `number`

Defined in: src/types/quota.types.ts:82

Max write ops per minute per RGW instance. 0 = unlimited.

***

### scope

> **scope**: `"bucket"` \| `"user"` \| `"anonymous"`

Defined in: src/types/quota.types.ts:78

Scope: 'user', 'bucket', or 'anonymous'. Required.
