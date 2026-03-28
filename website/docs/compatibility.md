---
sidebar_position: 7
title: Compatibility
description: Supported Ceph versions, Node.js runtimes, and platform compatibility for the radosgw-admin SDK.
keywords: [ceph versions, node.js, rook-ceph, openshift data foundation, compatibility, radosgw-admin]
---

# Compatibility

## Ceph Versions

The RGW Admin Ops API has been available since Ceph **Luminous (v12)**. This SDK is tested against **Quincy (v17)** and **Reef (v18)**.

| Feature | Minimum Ceph Version |
|---|---|
| Users, keys, subusers, buckets | Luminous (v12) |
| Quotas | Luminous (v12) |
| Usage logging | Luminous (v12) |
| Rate limits | Pacific (v16) |
| Cluster info endpoint | Luminous (v12) |

:::tip
If you're unsure which Ceph version you're running, use the SDK to check:
```ts
const info = await rgw.info.get();
console.log(info.info.storageBackends);
```
:::

## Node.js Versions

| Runtime | Supported |
|---|---|
| Node.js 18 (LTS) | Yes |
| Node.js 20 (LTS) | Yes |
| Node.js 22 (Current) | Yes |
| Bun | Yes (ESM only) |

The SDK requires **Node.js >= 18** because it uses the built-in `fetch` API and `node:crypto` for AWS SigV4 signing.

## Module Formats

| Format | Entry Point |
|---|---|
| ESM (`import`) | `dist/index.js` |
| CommonJS (`require`) | `dist/index.cjs` |
| TypeScript types | `dist/index.d.ts` |

Both formats are published in the npm package. The `exports` map in `package.json` ensures bundlers and runtimes resolve the correct format automatically.

## Platform Support

| Platform | Tested | Notes |
|---|---|---|
| **Rook-Ceph** (Kubernetes) | Yes | See [Rook-Ceph guide](/docs/guides/rook-ceph) |
| **OpenShift Data Foundation** | Yes | See [ODF guide](/docs/guides/odf) |
| **Bare-metal Ceph** | Yes | Direct connection to RGW daemon |
| **Ceph via Docker/Podman** | Yes | Port-forward or expose RGW port |

## RGW Prerequisites

Before using the SDK, ensure:

1. **Admin Ops API is enabled** — RGW exposes it by default at `/admin`
2. **Admin user has required capabilities:**
   ```bash
   radosgw-admin caps add --uid=admin --caps="users=*;buckets=*;metadata=*;usage=*;zone=*"
   ```
3. **Network access** — your Node.js app can reach the RGW endpoint (direct, port-forward, or via Kubernetes Service DNS)

## TLS / Self-Signed Certificates

For RGW deployments with self-signed certificates, use the `insecure` option:

```ts
const rgw = new RadosGWAdminClient({
  host: 'https://rgw.internal',
  accessKey: '...',
  secretKey: '...',
  insecure: true, // skips TLS verification — dev/test only
});
```

:::warning
Never use `insecure: true` in production. Instead, configure your Node.js environment to trust the CA certificate:
```bash
export NODE_EXTRA_CA_CERTS=/path/to/ca-cert.pem
```
:::

## Dependencies

**Minimal dependencies.** The SDK uses built-in Node.js modules for all core operations, plus one npm package maintained by the Node.js team itself:

| Package | Purpose | Transitive deps |
|---|---|---|
| `node:crypto` (built-in) | AWS SigV4 request signing | — |
| `globalThis.fetch` (built-in) | HTTP requests (Node 18+) | — |
| [`undici`](https://github.com/nodejs/undici) | Per-request TLS dispatcher for `insecure: true` mode | 0 |

`undici` is the HTTP library Node.js uses internally to power its built-in `fetch`. It is maintained by the Node.js core team and has zero transitive dependencies. No `aws-sdk`, no `axios`, no `node-fetch`. This means no supply chain risk and no version conflicts.
