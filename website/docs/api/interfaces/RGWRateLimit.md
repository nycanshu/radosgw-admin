[**radosgw-admin**](../README.md)

***

# Interface: RGWRateLimit

Defined in: src/types/quota.types.ts:31

Rate limit configuration returned by the RGW Admin API.

## Properties

### enabled

> **enabled**: `boolean`

Defined in: src/types/quota.types.ts:32

***

### maxReadBytes

> **maxReadBytes**: `number`

Defined in: src/types/quota.types.ts:38

Maximum read bytes per minute per RGW instance. 0 = unlimited.

***

### maxReadOps

> **maxReadOps**: `number`

Defined in: src/types/quota.types.ts:34

Maximum read operations per minute per RGW instance. 0 = unlimited.

***

### maxWriteBytes

> **maxWriteBytes**: `number`

Defined in: src/types/quota.types.ts:40

Maximum write bytes per minute per RGW instance. 0 = unlimited.

***

### maxWriteOps

> **maxWriteOps**: `number`

Defined in: src/types/quota.types.ts:36

Maximum write operations per minute per RGW instance. 0 = unlimited.
