[**radosgw-admin**](../README.md)

***

# Interface: ModifySubuserInput

Defined in: src/types/key.types.ts:50

Input for modifying a subuser.

## Properties

### access?

> `optional` **access**: `"read"` \| `"write"` \| `"readwrite"` \| `"full"`

Defined in: src/types/key.types.ts:64

Updated access level.

***

### generateSecret?

> `optional` **generateSecret**: `boolean`

Defined in: src/types/key.types.ts:66

Whether to auto-generate a secret.

***

### keyType?

> `optional` **keyType**: `"s3"` \| `"swift"`

Defined in: src/types/key.types.ts:62

Key type for the subuser.

***

### secretKey?

> `optional` **secretKey**: `string`

Defined in: src/types/key.types.ts:60

Secret key for the subuser.

#### Remarks

This value is transmitted as a query parameter per the RGW Admin Ops API wire
format. It is redacted from debug logs by the client.

***

### subuser

> **subuser**: `string`

Defined in: src/types/key.types.ts:54

Subuser ID in `uid:name` format (e.g. `"alice:swift"`). Required.

***

### uid

> **uid**: `string`

Defined in: src/types/key.types.ts:52

Parent user UID. Required.
