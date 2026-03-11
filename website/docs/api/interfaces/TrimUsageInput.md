[**radosgw-admin**](../README.md)

***

# Interface: TrimUsageInput

Defined in: src/types/usage.types.ts:16

## Properties

### end?

> `optional` **end**: `string` \| `Date`

Defined in: src/types/usage.types.ts:22

End of the date range to trim.

***

### removeAll?

> `optional` **removeAll**: `boolean`

Defined in: src/types/usage.types.ts:27

Required when `uid` is not provided to prevent accidental cluster-wide log deletion.
Setting this to `true` explicitly acknowledges that all matching logs will be removed.

***

### start?

> `optional` **start**: `string` \| `Date`

Defined in: src/types/usage.types.ts:20

Start of the date range to trim.

***

### uid?

> `optional` **uid**: `string`

Defined in: src/types/usage.types.ts:18

Trim usage logs only for this user. Omit to trim across all users.
