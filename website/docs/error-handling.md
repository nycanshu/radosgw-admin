---
sidebar_position: 5
---

# Error Handling

The SDK maps HTTP errors to typed classes:

- `400` -> `RGWValidationError`
- `403` -> `RGWAuthError`
- `404` -> `RGWNotFoundError`
- `409` -> `RGWConflictError`
- `5xx` -> `RGWError`

Example:

```ts
import { RGWNotFoundError } from 'radosgw-admin';

try {
  await rgw.users.get('missing-user');
} catch (err) {
  if (err instanceof RGWNotFoundError) {
    // handle safely
  }
}
```
