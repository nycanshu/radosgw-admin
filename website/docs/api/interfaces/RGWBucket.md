[**radosgw-admin**](../README.md)

***

# Interface: RGWBucket

Defined in: src/types/bucket.types.ts:14

Full RGW bucket object returned by the admin API.

## Properties

### bucket

> **bucket**: `string`

Defined in: src/types/bucket.types.ts:15

***

### bucketQuota

> **bucketQuota**: [`RGWQuota`](RGWQuota.md)

Defined in: src/types/bucket.types.ts:32

***

### creationTime

> **creationTime**: `string`

Defined in: src/types/bucket.types.ts:25

***

### explicitTenant

> **explicitTenant**: `boolean`

Defined in: src/types/bucket.types.ts:17

***

### id

> **id**: `string`

Defined in: src/types/bucket.types.ts:18

***

### indexType

> **indexType**: `string`

Defined in: src/types/bucket.types.ts:20

***

### marker

> **marker**: `string`

Defined in: src/types/bucket.types.ts:19

***

### masterVer

> **masterVer**: `string`

Defined in: src/types/bucket.types.ts:23

***

### maxMarker

> **maxMarker**: `string`

Defined in: src/types/bucket.types.ts:26

***

### mtime

> **mtime**: `string`

Defined in: src/types/bucket.types.ts:24

***

### owner

> **owner**: `string`

Defined in: src/types/bucket.types.ts:21

***

### tenant

> **tenant**: `string`

Defined in: src/types/bucket.types.ts:16

***

### usage

> **usage**: `object`

Defined in: src/types/bucket.types.ts:27

#### Index Signature

\[`storageClass`: `string`\]: [`RGWBucketUsage`](RGWBucketUsage.md) \| `undefined`

#### rgwMain

> **rgwMain**: [`RGWBucketUsage`](RGWBucketUsage.md)

#### rgwMultimeta?

> `optional` **rgwMultimeta**: [`RGWBucketUsage`](RGWBucketUsage.md)

***

### ver

> **ver**: `string`

Defined in: src/types/bucket.types.ts:22
