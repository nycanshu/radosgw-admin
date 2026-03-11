[**radosgw-admin**](../README.md)

***

# Interface: ModifySubuserInput

Defined in: src/types/key.types.ts:42

Input for modifying a subuser.

## Properties

### access?

> `optional` **access**: `"read"` \| `"write"` \| `"readwrite"` \| `"full"`

Defined in: src/types/key.types.ts:52

Updated access level.

***

### generateSecret?

> `optional` **generateSecret**: `boolean`

Defined in: src/types/key.types.ts:54

Whether to auto-generate a secret.

***

### keyType?

> `optional` **keyType**: `"s3"` \| `"swift"`

Defined in: src/types/key.types.ts:50

Key type for the subuser.

***

### secretKey?

> `optional` **secretKey**: `string`

Defined in: src/types/key.types.ts:48

Secret key for the subuser.

***

### subuser

> **subuser**: `string`

Defined in: src/types/key.types.ts:46

Subuser ID (e.g. "alice:swift"). Required.

***

### uid

> **uid**: `string`

Defined in: src/types/key.types.ts:44

Parent user UID. Required.
