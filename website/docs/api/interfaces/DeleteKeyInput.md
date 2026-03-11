[**radosgw-admin**](../README.md)

***

# Interface: DeleteKeyInput

Defined in: src/types/key.types.ts:16

Input for deleting an S3 or Swift key.

## Properties

### accessKey

> **accessKey**: `string`

Defined in: src/types/key.types.ts:18

The access key to delete. Required.

***

### keyType?

> `optional` **keyType**: `"s3"` \| `"swift"`

Defined in: src/types/key.types.ts:22

Key type. Default: 's3'.

***

### uid?

> `optional` **uid**: `string`

Defined in: src/types/key.types.ts:20

User ID. Required for Swift keys.
