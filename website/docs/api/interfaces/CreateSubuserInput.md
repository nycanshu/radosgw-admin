[**radosgw-admin**](../README.md)

***

# Interface: CreateSubuserInput

Defined in: src/types/key.types.ts:30

Input for creating a subuser.

## Properties

### access?

> `optional` **access**: `"read"` \| `"write"` \| `"readwrite"` \| `"full"`

Defined in: src/types/key.types.ts:44

Access level for the subuser.

***

### generateSecret?

> `optional` **generateSecret**: `boolean`

Defined in: src/types/key.types.ts:46

Whether to auto-generate a secret. Default: true.

***

### keyType?

> `optional` **keyType**: `"s3"` \| `"swift"`

Defined in: src/types/key.types.ts:42

Key type for the subuser.

***

### secretKey?

> `optional` **secretKey**: `string`

Defined in: src/types/key.types.ts:40

Secret key for the subuser. Auto-generated if omitted.

#### Remarks

This value is transmitted as a query parameter per the RGW Admin Ops API wire
format. It is redacted from debug logs by the client.

***

### subuser

> **subuser**: `string`

Defined in: src/types/key.types.ts:34

Subuser ID in `uid:name` format (e.g. `"alice:swift"`). Required.

***

### uid

> **uid**: `string`

Defined in: src/types/key.types.ts:32

Parent user UID. Required.
