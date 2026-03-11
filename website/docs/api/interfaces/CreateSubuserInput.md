[**radosgw-admin**](../README.md)

***

# Interface: CreateSubuserInput

Defined in: src/types/key.types.ts:26

Input for creating a subuser.

## Properties

### access?

> `optional` **access**: `"read"` \| `"write"` \| `"readwrite"` \| `"full"`

Defined in: src/types/key.types.ts:36

Access level for the subuser.

***

### generateSecret?

> `optional` **generateSecret**: `boolean`

Defined in: src/types/key.types.ts:38

Whether to auto-generate a secret. Default: true.

***

### keyType?

> `optional` **keyType**: `"s3"` \| `"swift"`

Defined in: src/types/key.types.ts:34

Key type for the subuser.

***

### secretKey?

> `optional` **secretKey**: `string`

Defined in: src/types/key.types.ts:32

Secret key for the subuser. Auto-generated if omitted.

***

### subuser

> **subuser**: `string`

Defined in: src/types/key.types.ts:30

Subuser ID (e.g. "alice:swift"). Required.

***

### uid

> **uid**: `string`

Defined in: src/types/key.types.ts:28

Parent user UID. Required.
