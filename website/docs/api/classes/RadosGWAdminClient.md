[**radosgw-admin**](../README.md)

***

# Class: RadosGWAdminClient

Defined in: src/index.ts:32

RadosGW Admin Client — the single entry point for all RGW Admin API operations.

## Example

```typescript
import { RadosGWAdminClient } from 'radosgw-admin';

const client = new RadosGWAdminClient({
  host: 'http://192.168.1.100',
  port: 8080,
  accessKey: 'ADMIN_ACCESS_KEY',
  secretKey: 'ADMIN_SECRET_KEY',
});

const user = await client.users.create({
  uid: 'alice',
  displayName: 'Alice',
});
```

## Constructors

### Constructor

> **new RadosGWAdminClient**(`config`): `RadosGWAdminClient`

Defined in: src/index.ts:60

#### Parameters

##### config

[`ClientConfig`](../interfaces/ClientConfig.md)

#### Returns

`RadosGWAdminClient`

## Properties

### buckets

> `readonly` **buckets**: `BucketsModule`

Defined in: src/index.ts:46

Bucket management operations.

***

### info

> `readonly` **info**: `InfoModule`

Defined in: src/index.ts:58

Cluster info operations.

***

### keys

> `readonly` **keys**: `KeysModule`

Defined in: src/index.ts:40

S3/Swift key management operations.

***

### quota

> `readonly` **quota**: `QuotaModule`

Defined in: src/index.ts:49

Quota management operations (user-level and bucket-level).

***

### rateLimit

> `readonly` **rateLimit**: `RateLimitModule`

Defined in: src/index.ts:52

Rate limit management operations (user, bucket, and global).

***

### subusers

> `readonly` **subusers**: `SubusersModule`

Defined in: src/index.ts:43

Subuser management operations.

***

### usage

> `readonly` **usage**: `UsageModule`

Defined in: src/index.ts:55

Usage & analytics operations — query and trim RGW usage logs.

***

### users

> `readonly` **users**: `UsersModule`

Defined in: src/index.ts:37

User management operations.
