[**radosgw-admin**](../README.md)

***

# Interface: RGWUser

Defined in: src/types/user.types.ts:108

Full RGW user object returned by the admin API.

## Extended by

- [`RGWUserWithStats`](RGWUserWithStats.md)

## Properties

### bucketQuota

> **bucketQuota**: [`RGWQuota`](RGWQuota.md)

Defined in: src/types/user.types.ts:127

***

### caps

> **caps**: [`RGWCap`](RGWCap.md)[]

Defined in: src/types/user.types.ts:121

***

### defaultPlacement

> **defaultPlacement**: `string`

Defined in: src/types/user.types.ts:123

***

### defaultStorageClass

> **defaultStorageClass**: `string`

Defined in: src/types/user.types.ts:124

***

### displayName

> **displayName**: `string`

Defined in: src/types/user.types.ts:110

***

### email

> **email**: `string`

Defined in: src/types/user.types.ts:111

***

### keys

> **keys**: [`RGWKey`](RGWKey.md)[]

Defined in: src/types/user.types.ts:119

***

### maxBuckets

> **maxBuckets**: `number`

Defined in: src/types/user.types.ts:117

***

### mfaIds?

> `optional` **mfaIds**: `string`[]

Defined in: src/types/user.types.ts:135

MFA device IDs associated with this user. May be absent on older Ceph versions.

***

### opMask

> **opMask**: `string`

Defined in: src/types/user.types.ts:122

***

### placementTags

> **placementTags**: `string`[]

Defined in: src/types/user.types.ts:125

***

### subusers

> **subusers**: [`RGWSubuser`](RGWSubuser.md)[]

Defined in: src/types/user.types.ts:118

***

### suspended

> **suspended**: `number`

Defined in: src/types/user.types.ts:116

Whether the user is suspended. `0` = active, `1` = suspended.
Use numeric comparison: `user.suspended === 1` or treat as truthy/falsy.

***

### swiftKeys

> **swiftKeys**: [`RGWSwiftKey`](RGWSwiftKey.md)[]

Defined in: src/types/user.types.ts:120

***

### tenant

> **tenant**: `string`

Defined in: src/types/user.types.ts:126

***

### type?

> `optional` **type**: `string`

Defined in: src/types/user.types.ts:133

User type. Common values: `"rgw"`, `"ldap"`, `"s3"`.
May be absent on older Ceph versions.

***

### userId

> **userId**: `string`

Defined in: src/types/user.types.ts:109

***

### userQuota

> **userQuota**: [`RGWQuota`](RGWQuota.md)

Defined in: src/types/user.types.ts:128
