---
sidebar_position: 5
title: Error Handling
description: Handle Ceph RGW errors in Node.js with typed error classes — RGWNotFoundError, RGWAuthError, RGWConflictError, RGWRateLimitError, RGWServiceError and more.
keywords: [error handling, ceph rgw errors, radosgw-admin, NoSuchUser, NoSuchBucket, rate limit, 429]
---

# Error Handling

Every error thrown by the SDK is an instance of `RGWError` with structured properties.

## Error Hierarchy

```
Error
 └── RGWError (base — all SDK errors extend this)
      ├── RGWValidationError   (400 / client-side validation)
      ├── RGWNotFoundError     (404)
      ├── RGWAuthError         (403)
      ├── RGWConflictError     (409)
      ├── RGWRateLimitError    (429, retryable)
      └── RGWServiceError      (5xx, retryable)
```

## HTTP Status Mapping

| HTTP Status | Error Class | Retryable | When |
|---|---|---|---|
| _(pre-request)_ | `RGWValidationError` | No | Invalid input (missing uid, bad params) |
| 400 | `RGWValidationError` | No | Bad request parameters |
| 403 | `RGWAuthError` | No | Invalid credentials or missing capabilities |
| 404 | `RGWNotFoundError` | No | User, bucket, key, or subuser not found |
| 409 | `RGWConflictError` | No | Resource already exists |
| 429 | `RGWRateLimitError` | **Yes** | Rate limit exceeded |
| 5xx | `RGWServiceError` | **Yes** | RGW server error |
| Network | `RGWError` (code: `NetworkError`) | **Yes** | Connection refused, DNS failure, etc. |
| Timeout | `RGWError` (code: `Timeout`) | **Yes** | Request exceeded timeout |

## Error Properties

Every error exposes these properties:

```ts
catch (err) {
  if (err instanceof RGWError) {
    err.message;    // Human-readable description
    err.statusCode; // HTTP status (undefined for validation errors)
    err.code;       // RGW error code from the response body
    err.name;       // Error class name (e.g. "RGWNotFoundError")
  }
}
```

## The `code` Field — RGW Error Codes

RGW returns specific error codes in its response body. The SDK preserves these on the `code` property so you can distinguish between different error scenarios:

### 400 Codes (RGWValidationError)

| Code | Meaning |
|---|---|
| `InvalidArgument` | A query parameter has an invalid value |
| `InvalidBucketName` | Bucket name does not follow naming rules |
| `MalformedPolicy` | Invalid policy document |
| `ValidationError` | Client-side validation (no HTTP call made) |

### 404 Codes (RGWNotFoundError)

| Code | Meaning |
|---|---|
| `NoSuchUser` | User UID does not exist |
| `NoSuchBucket` | Bucket name does not exist |
| `NoSuchKey` | Access key does not exist |
| `NoSuchSubUser` | Subuser does not exist |

### 403 Codes (RGWAuthError)

| Code | Meaning |
|---|---|
| `AccessDenied` | Admin user lacks required capabilities |
| `InvalidAccessKeyId` | Access key is invalid or does not exist |
| `SignatureDoesNotMatch` | Secret key is incorrect |

### 409 Codes (RGWConflictError)

| Code | Meaning |
|---|---|
| `UserAlreadyExists` | UID is already in use |
| `BucketAlreadyExists` | Bucket name is taken |
| `KeyExists` | Access key already assigned |
| `EmailExists` | Email address already in use |

### 429 Codes (RGWRateLimitError)

| Code | Meaning |
|---|---|
| `TooManyRequests` | Rate limit exceeded |
| `SlowDown` | Rate limit exceeded (S3-style code) |

### 5xx Codes (RGWServiceError)

| Code | Meaning |
|---|---|
| `InternalError` | RGW internal failure |
| `ServiceUnavailable` | RGW temporarily unavailable |

## Usage Examples

### Catch specific error types

```ts
import {
  RGWNotFoundError,
  RGWAuthError,
  RGWConflictError,
  RGWRateLimitError,
  RGWServiceError,
} from 'radosgw-admin';

try {
  await rgw.users.get('alice');
} catch (err) {
  if (err instanceof RGWNotFoundError) {
    console.log(`User not found (${err.code})`); // "User not found (NoSuchUser)"
  } else if (err instanceof RGWAuthError) {
    console.log('Check admin credentials');
  } else if (err instanceof RGWConflictError) {
    console.log('Resource already exists');
  } else if (err instanceof RGWRateLimitError) {
    console.log('Rate limited — try again later');
  } else if (err instanceof RGWServiceError) {
    console.log(`Server error: ${err.statusCode}`);
  }
}
```

### Inspect the RGW error code

```ts
try {
  await rgw.users.create({ uid: 'alice', displayName: 'Alice' });
} catch (err) {
  if (err instanceof RGWConflictError && err.code === 'EmailExists') {
    console.log('Email is already used by another user');
  } else if (err instanceof RGWConflictError && err.code === 'UserAlreadyExists') {
    console.log('UID is already taken');
  }
}
```

### Handle network errors

```ts
try {
  await rgw.users.list();
} catch (err) {
  if (err instanceof RGWError) {
    if (err.code === 'NetworkError') {
      console.log('Cannot reach RGW — check host and port');
    } else if (err.code === 'Timeout') {
      console.log(`Request timed out — increase timeout config`);
    }
  }
}
```

## Retry Behavior

When `maxRetries > 0`, these errors are automatically retried with exponential backoff + jitter:

- **429** (`RGWRateLimitError`) — rate limit exceeded
- **5xx** (`RGWServiceError`) — server errors
- **Network errors** — connection refused, DNS failure, etc.
- **Timeouts** — request exceeded timeout

Non-retryable errors (400, 403, 404, 409) fail immediately on the first attempt.

```ts
const rgw = new RadosGWAdminClient({
  host: '...',
  accessKey: '...',
  secretKey: '...',
  maxRetries: 3,   // retry up to 3 times
  retryDelay: 200, // 200ms base delay with jitter
});
```

## Destructive Operation Warnings

Methods that permanently delete data emit a `console.warn` before executing:

- `users.delete({ purgeData: true })`
- `buckets.delete({ purgeObjects: true })`
- `usage.trim({ removeAll: true })`

To suppress in CI/automation, redirect stderr or patch `console.warn`.
