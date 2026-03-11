[**radosgw-admin**](../README.md)

***

# Interface: DeleteUserInput

Defined in: src/types/user.types.ts:63

Input for deleting a user.

## Properties

### purgeData?

> `optional` **purgeData**: `boolean`

Defined in: src/types/user.types.ts:67

If true, permanently deletes all buckets and objects owned by the user. Default: false. DESTRUCTIVE.

***

### uid

> **uid**: `string`

Defined in: src/types/user.types.ts:65

User ID to delete. Required.
