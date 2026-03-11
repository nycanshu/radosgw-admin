[**radosgw-admin**](../README.md)

***

# Function: signRequest()

> **signRequest**(`request`, `date?`): `SignedHeaders`

Defined in: src/signer.ts:71

Signs an HTTP request using AWS Signature Version 4.

## Parameters

### request

`SignRequest`

The request details to sign

### date?

`Date`

Optional date override (used for testing)

## Returns

`SignedHeaders`

Headers that must be added to the request
