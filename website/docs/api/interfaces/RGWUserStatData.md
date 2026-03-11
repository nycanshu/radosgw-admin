[**radosgw-admin**](../README.md)

***

# Interface: RGWUserStatData

Defined in: src/types/user.types.ts:139

The raw usage statistics returned by `GET /user?stats=true`.

## Properties

### numObjects

> **numObjects**: `number`

Defined in: src/types/user.types.ts:153

Total number of objects stored.

***

### size

> **size**: `number`

Defined in: src/types/user.types.ts:141

Total bytes used (logical).

***

### sizeActual

> **sizeActual**: `number`

Defined in: src/types/user.types.ts:143

Total bytes actually consumed on disk (accounting for alignment).

***

### sizeKb

> **sizeKb**: `number`

Defined in: src/types/user.types.ts:147

Total kilobytes used (logical).

***

### sizeKbActual

> **sizeKbActual**: `number`

Defined in: src/types/user.types.ts:149

Total kilobytes actually on disk.

***

### sizeKbUtilized

> **sizeKbUtilized**: `number`

Defined in: src/types/user.types.ts:151

Total kilobytes utilized.

***

### sizeUtilized

> **sizeUtilized**: `number`

Defined in: src/types/user.types.ts:145

Total bytes utilized (used + overhead).
