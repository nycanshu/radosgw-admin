[**radosgw-admin**](../README.md)

***

# Interface: RGWUserWithStats

Defined in: src/types/user.types.ts:161

Full user object with embedded storage statistics.
Returned by `client.users.getStats()`.
Contains all fields from [RGWUser](RGWUser.md) plus a `stats` field.

## Extends

- [`RGWUser`](RGWUser.md)

## Properties

### bucketQuota

> **bucketQuota**: [`RGWQuota`](RGWQuota.md)

Defined in: src/types/user.types.ts:127

#### Inherited from

[`RGWUser`](RGWUser.md).[`bucketQuota`](RGWUser.md#bucketquota)

***

### caps

> **caps**: [`RGWCap`](RGWCap.md)[]

Defined in: src/types/user.types.ts:121

#### Inherited from

[`RGWUser`](RGWUser.md).[`caps`](RGWUser.md#caps)

***

### defaultPlacement

> **defaultPlacement**: `string`

Defined in: src/types/user.types.ts:123

#### Inherited from

[`RGWUser`](RGWUser.md).[`defaultPlacement`](RGWUser.md#defaultplacement)

***

### defaultStorageClass

> **defaultStorageClass**: `string`

Defined in: src/types/user.types.ts:124

#### Inherited from

[`RGWUser`](RGWUser.md).[`defaultStorageClass`](RGWUser.md#defaultstorageclass)

***

### displayName

> **displayName**: `string`

Defined in: src/types/user.types.ts:110

#### Inherited from

[`RGWUser`](RGWUser.md).[`displayName`](RGWUser.md#displayname)

***

### email

> **email**: `string`

Defined in: src/types/user.types.ts:111

#### Inherited from

[`RGWUser`](RGWUser.md).[`email`](RGWUser.md#email)

***

### keys

> **keys**: [`RGWKey`](RGWKey.md)[]

Defined in: src/types/user.types.ts:119

#### Inherited from

[`RGWUser`](RGWUser.md).[`keys`](RGWUser.md#keys)

***

### maxBuckets

> **maxBuckets**: `number`

Defined in: src/types/user.types.ts:117

#### Inherited from

[`RGWUser`](RGWUser.md).[`maxBuckets`](RGWUser.md#maxbuckets)

***

### mfaIds?

> `optional` **mfaIds**: `string`[]

Defined in: src/types/user.types.ts:135

MFA device IDs associated with this user. May be absent on older Ceph versions.

#### Inherited from

[`RGWUser`](RGWUser.md).[`mfaIds`](RGWUser.md#mfaids)

***

### opMask

> **opMask**: `string`

Defined in: src/types/user.types.ts:122

#### Inherited from

[`RGWUser`](RGWUser.md).[`opMask`](RGWUser.md#opmask)

***

### placementTags

> **placementTags**: `string`[]

Defined in: src/types/user.types.ts:125

#### Inherited from

[`RGWUser`](RGWUser.md).[`placementTags`](RGWUser.md#placementtags)

***

### stats

> **stats**: [`RGWUserStatData`](RGWUserStatData.md)

Defined in: src/types/user.types.ts:162

***

### subusers

> **subusers**: [`RGWSubuser`](RGWSubuser.md)[]

Defined in: src/types/user.types.ts:118

#### Inherited from

[`RGWUser`](RGWUser.md).[`subusers`](RGWUser.md#subusers)

***

### suspended

> **suspended**: `number`

Defined in: src/types/user.types.ts:116

Whether the user is suspended. `0` = active, `1` = suspended.
Use numeric comparison: `user.suspended === 1` or treat as truthy/falsy.

#### Inherited from

[`RGWUser`](RGWUser.md).[`suspended`](RGWUser.md#suspended)

***

### swiftKeys

> **swiftKeys**: [`RGWSwiftKey`](RGWSwiftKey.md)[]

Defined in: src/types/user.types.ts:120

#### Inherited from

[`RGWUser`](RGWUser.md).[`swiftKeys`](RGWUser.md#swiftkeys)

***

### tenant

> **tenant**: `string`

Defined in: src/types/user.types.ts:126

#### Inherited from

[`RGWUser`](RGWUser.md).[`tenant`](RGWUser.md#tenant)

***

### type?

> `optional` **type**: `string`

Defined in: src/types/user.types.ts:133

User type. Common values: `"rgw"`, `"ldap"`, `"s3"`.
May be absent on older Ceph versions.

#### Inherited from

[`RGWUser`](RGWUser.md).[`type`](RGWUser.md#type)

***

### userId

> **userId**: `string`

Defined in: src/types/user.types.ts:109

#### Inherited from

[`RGWUser`](RGWUser.md).[`userId`](RGWUser.md#userid)

***

### userQuota

> **userQuota**: [`RGWQuota`](RGWQuota.md)

Defined in: src/types/user.types.ts:128

#### Inherited from

[`RGWUser`](RGWUser.md).[`userQuota`](RGWUser.md#userquota)
