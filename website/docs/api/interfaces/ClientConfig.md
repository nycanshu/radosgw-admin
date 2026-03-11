[**radosgw-admin**](../README.md)

***

# Interface: ClientConfig

Defined in: src/types/common.types.ts:4

Configuration for the RadosGW Admin Client.

## Properties

### accessKey

> **accessKey**: `string`

Defined in: src/types/common.types.ts:10

Admin access key for AWS SigV4 authentication

***

### adminPath?

> `optional` **adminPath**: `string`

Defined in: src/types/common.types.ts:14

Admin API path prefix. Default: "/admin"

***

### debug?

> `optional` **debug**: `boolean`

Defined in: src/types/common.types.ts:20

Enable debug logging of requests and responses. Default: false

***

### host

> **host**: `string`

Defined in: src/types/common.types.ts:6

RGW endpoint, e.g. "http://192.168.1.10" or "https://ceph.example.com"

***

### insecure?

> `optional` **insecure**: `boolean`

Defined in: src/types/common.types.ts:18

Skip TLS certificate verification. Default: false

***

### maxRetries?

> `optional` **maxRetries**: `number`

Defined in: src/types/common.types.ts:22

Maximum number of retries for transient errors (5xx, timeouts, network errors). Default: 0 (no retries)

***

### port?

> `optional` **port**: `number`

Defined in: src/types/common.types.ts:8

Port number. Omit to use the default from the host URL.

***

### region?

> `optional` **region**: `string`

Defined in: src/types/common.types.ts:26

AWS region for SigV4 signing. Default: "us-east-1"

***

### retryDelay?

> `optional` **retryDelay**: `number`

Defined in: src/types/common.types.ts:24

Base delay in ms for exponential backoff between retries. Default: 200

***

### secretKey

> **secretKey**: `string`

Defined in: src/types/common.types.ts:12

Admin secret key for AWS SigV4 authentication

***

### timeout?

> `optional` **timeout**: `number`

Defined in: src/types/common.types.ts:16

Request timeout in milliseconds. Default: 10000
