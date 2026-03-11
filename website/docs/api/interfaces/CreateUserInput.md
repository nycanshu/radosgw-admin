[**radosgw-admin**](../README.md)

***

# Interface: CreateUserInput

Defined in: src/types/user.types.ts:2

Input for creating a new RGW user.

## Properties

### accessKey?

> `optional` **accessKey**: `string`

Defined in: src/types/user.types.ts:12

Specify an access key instead of auto-generating.

***

### displayName

> **displayName**: `string`

Defined in: src/types/user.types.ts:6

Display name for the user. Required. Must not be whitespace-only.

***

### email?

> `optional` **email**: `string`

Defined in: src/types/user.types.ts:8

Email address. Basic format validation is applied.

***

### generateKey?

> `optional` **generateKey**: `boolean`

Defined in: src/types/user.types.ts:29

Whether to auto-generate a key pair. Default: true.

***

### keyType?

> `optional` **keyType**: `"s3"` \| `"swift"`

Defined in: src/types/user.types.ts:10

Key type to generate. Default: 's3'.

***

### maxBuckets?

> `optional` **maxBuckets**: `number`

Defined in: src/types/user.types.ts:31

Maximum number of buckets allowed. Default: 1000. Use -1 for unlimited.

***

### opMask?

> `optional` **opMask**: `string`

Defined in: src/types/user.types.ts:41

Operation mask — limits which S3 operations the user can perform.
Comma-separated list of operations: `read`, `write`, `delete`, `*`.

#### Example

```ts
`"read, write"`
```

***

### secretKey?

> `optional` **secretKey**: `string`

Defined in: src/types/user.types.ts:18

Specify a secret key instead of auto-generating.

#### Remarks

This value is transmitted as a query parameter per the RGW Admin Ops API wire
format. It is redacted from debug logs by the client.

***

### suspended?

> `optional` **suspended**: `boolean`

Defined in: src/types/user.types.ts:33

Whether the user is suspended on creation. Default: false.

***

### tenant?

> `optional` **tenant**: `string`

Defined in: src/types/user.types.ts:35

Tenant name for multi-tenancy.

***

### uid

> **uid**: `string`

Defined in: src/types/user.types.ts:4

Unique user ID. Required. Must not contain colons (reserved for subuser notation).

***

### userCaps?

> `optional` **userCaps**: `string`

Defined in: src/types/user.types.ts:27

User capabilities string. Controls which admin operations the user may perform.
Format: `"type=perm"` or `"type1=perm;type2=perm"`.
Valid types: `users`, `buckets`, `metadata`, `usage`, `zone`, `info`, `bilog`,
  `mdlog`, `datalog`, `user-policy`, `oidc-provider`, `roles`, `ratelimit`.
Valid perms: `*`, `read`, `write`, `read, write`.

#### Example

```ts
`"users=*;buckets=read"`
```
