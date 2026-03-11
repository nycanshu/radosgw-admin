[**radosgw-admin**](../README.md)

***

# Interface: RGWQuota

Defined in: src/types/user.types.ts:96

Quota configuration (used for both user and bucket quotas).

## Properties

### checkOnRaw

> **checkOnRaw**: `boolean`

Defined in: src/types/user.types.ts:98

***

### enabled

> **enabled**: `boolean`

Defined in: src/types/user.types.ts:97

***

### maxObjects

> **maxObjects**: `number`

Defined in: src/types/user.types.ts:104

Maximum number of objects. -1 means unlimited.

***

### maxSize

> **maxSize**: `number`

Defined in: src/types/user.types.ts:100

Quota in bytes. -1 means unlimited.

***

### maxSizeKb

> **maxSizeKb**: `number`

Defined in: src/types/user.types.ts:102

Quota in kilobytes. -1 means unlimited.
