[**radosgw-admin**](../README.md)

***

# Interface: RGWUsageCategory

Defined in: src/types/usage.types.ts:30

## Properties

### bytesReceived

> **bytesReceived**: `number`

Defined in: src/types/usage.types.ts:36

Total bytes received (ingress) for this category.

***

### bytesSent

> **bytesSent**: `number`

Defined in: src/types/usage.types.ts:34

Total bytes sent (egress) for this category.

***

### category

> **category**: `string`

Defined in: src/types/usage.types.ts:32

Operation category, e.g. "get_obj", "put_obj", "delete_obj", "list_buckets".

***

### ops

> **ops**: `number`

Defined in: src/types/usage.types.ts:38

Total number of operations attempted.

***

### successfulOps

> **successfulOps**: `number`

Defined in: src/types/usage.types.ts:40

Total number of operations that succeeded.
