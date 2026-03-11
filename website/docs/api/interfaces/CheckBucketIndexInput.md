[**radosgw-admin**](../README.md)

***

# Interface: CheckBucketIndexInput

Defined in: src/types/bucket.types.ts:62

Input for checking/repairing a bucket index.

## Properties

### bucket

> **bucket**: `string`

Defined in: src/types/bucket.types.ts:64

Bucket name. Required.

***

### checkObjects?

> `optional` **checkObjects**: `boolean`

Defined in: src/types/bucket.types.ts:66

Whether to check object data consistency. Default: false.

***

### fix?

> `optional` **fix**: `boolean`

Defined in: src/types/bucket.types.ts:68

Whether to fix any detected issues. Default: false (dry run).
