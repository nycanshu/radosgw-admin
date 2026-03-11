[**radosgw-admin**](../README.md)

***

# Interface: CreateKeyInput

Defined in: src/types/key.types.ts:2

Input for creating a new S3 or Swift key for a user.

## Properties

### accessKey?

> `optional` **accessKey**: `string`

Defined in: src/types/key.types.ts:8

Specify an access key instead of auto-generating.

***

### generateKey?

> `optional` **generateKey**: `boolean`

Defined in: src/types/key.types.ts:12

Whether to auto-generate the key. Default: true.

***

### keyType?

> `optional` **keyType**: `"s3"` \| `"swift"`

Defined in: src/types/key.types.ts:6

Key type. Default: 's3'.

***

### secretKey?

> `optional` **secretKey**: `string`

Defined in: src/types/key.types.ts:10

Specify a secret key instead of auto-generating.

***

### uid

> **uid**: `string`

Defined in: src/types/key.types.ts:4

User ID to create the key for. Required.
