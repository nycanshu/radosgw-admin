[**radosgw-admin**](../README.md)

***

# Interface: DeleteSubuserInput

Defined in: src/types/key.types.ts:70

Input for deleting a subuser.

## Properties

### purgeKeys?

> `optional` **purgeKeys**: `boolean`

Defined in: src/types/key.types.ts:76

Whether to also purge the subuser's keys. Default: true.

***

### subuser

> **subuser**: `string`

Defined in: src/types/key.types.ts:74

Subuser ID in `uid:name` format (e.g. `"alice:swift"`). Required.

***

### uid

> **uid**: `string`

Defined in: src/types/key.types.ts:72

Parent user UID. Required.
