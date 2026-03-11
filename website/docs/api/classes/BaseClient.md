[**radosgw-admin**](../README.md)

***

# Class: BaseClient

Defined in: src/client.ts:99

Core HTTP client for making signed requests to the RGW Admin API.

## Constructors

### Constructor

> **new BaseClient**(`config`): `BaseClient`

Defined in: src/client.ts:112

#### Parameters

##### config

[`ClientConfig`](../interfaces/ClientConfig.md)

#### Returns

`BaseClient`

## Methods

### request()

> **request**\<`T`\>(`options`): `Promise`\<`T`\>

Defined in: src/client.ts:205

Makes a signed HTTP request to the RGW Admin API with retry support.

#### Type Parameters

##### T

`T`

#### Parameters

##### options

[`RequestOptions`](../interfaces/RequestOptions.md)

Request method, path, query params, and optional body

#### Returns

`Promise`\<`T`\>

Parsed and camelCase-transformed JSON response, or void for empty responses
