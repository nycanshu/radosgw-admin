[**radosgw-admin**](../README.md)

***

# Interface: ModifyUserInput

Defined in: src/types/user.types.ts:45

Input for modifying an existing user.

## Properties

### displayName?

> `optional` **displayName**: `string`

Defined in: src/types/user.types.ts:49

New display name.

***

### email?

> `optional` **email**: `string`

Defined in: src/types/user.types.ts:51

New email address. Basic format validation is applied.

***

### maxBuckets?

> `optional` **maxBuckets**: `number`

Defined in: src/types/user.types.ts:53

Maximum number of buckets.

***

### opMask?

> `optional` **opMask**: `string`

Defined in: src/types/user.types.ts:59

Operation mask. See [CreateUserInput.opMask](CreateUserInput.md#opmask) for format.

***

### suspended?

> `optional` **suspended**: `boolean`

Defined in: src/types/user.types.ts:55

Suspend or unsuspend the user.

***

### uid

> **uid**: `string`

Defined in: src/types/user.types.ts:47

User ID to modify. Required.

***

### userCaps?

> `optional` **userCaps**: `string`

Defined in: src/types/user.types.ts:57

User capabilities string. See [CreateUserInput.userCaps](CreateUserInput.md#usercaps) for format.
