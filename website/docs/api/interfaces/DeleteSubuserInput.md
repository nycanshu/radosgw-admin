[**radosgw-admin**](../README.md)

***

# Interface: DeleteSubuserInput

Defined in: src/types/key.types.ts:58

Input for deleting a subuser.

## Properties

### purgeKeys?

> `optional` **purgeKeys**: `boolean`

Defined in: src/types/key.types.ts:64

Whether to also purge the subuser's keys. Default: true.

***

### subuser

> **subuser**: `string`

Defined in: src/types/key.types.ts:62

Subuser ID to delete. Required.

***

### uid

> **uid**: `string`

Defined in: src/types/key.types.ts:60

Parent user UID. Required.
