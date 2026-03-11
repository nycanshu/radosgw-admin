---
sidebar_position: 6
---

# Recipes

## Provision User With Quota

```ts
await rgw.users.create({ uid: 'alice', displayName: 'Alice' });
await rgw.quota.setUserQuota({
  uid: 'alice',
  maxSize: '10G',
  maxObjects: 100000,
  enabled: true,
});
```

## Suspend User Access

```ts
await rgw.users.suspend('alice');
```

## Rotate Access Keys

```ts
const keys = await rgw.keys.generate({ uid: 'alice' });
await rgw.keys.revoke({ accessKey: keys[0].accessKey });
```
