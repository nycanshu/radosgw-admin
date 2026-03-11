[**radosgw-admin**](../README.md)

***

# Interface: DeleteBucketInput

Defined in: src/types/bucket.types.ts:36

Input for deleting a bucket.

## Properties

### bucket

> **bucket**: `string`

Defined in: src/types/bucket.types.ts:38

Bucket name. Required.

***

### purgeObjects?

> `optional` **purgeObjects**: `boolean`

Defined in: src/types/bucket.types.ts:40

If true, permanently deletes all objects in the bucket. Default: false. DESTRUCTIVE.
