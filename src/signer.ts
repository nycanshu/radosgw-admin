import { createHmac, createHash } from 'node:crypto';

const ALGORITHM = 'AWS4-HMAC-SHA256';
const SERVICE = 's3';
const UNSIGNED_PAYLOAD = 'UNSIGNED-PAYLOAD';

/**
 * AWS Signature V4 signer for RGW Admin API requests.
 * Implemented without external dependencies using node:crypto.
 */
export interface SignedHeaders {
  [header: string]: string;
}

export interface SignRequest {
  method: string;
  url: URL;
  headers: Record<string, string>;
  body?: string;
  accessKey: string;
  secretKey: string;
  region: string;
}

function sha256(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

function hmacSha256(key: string | Buffer, data: string): Buffer {
  return createHmac('sha256', key).update(data).digest();
}

function hmacSha256Hex(key: string | Buffer, data: string): string {
  return createHmac('sha256', key).update(data).digest('hex');
}

function getDateStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').slice(0, 8);
}

function getAmzDate(date: Date): string {
  return date
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}/, '');
}

function getSigningKey(secretKey: string, dateStamp: string, region: string): Buffer {
  const kDate = hmacSha256(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, SERVICE);
  return hmacSha256(kService, 'aws4_request');
}

function getCanonicalQueryString(url: URL): string {
  const params = Array.from(url.searchParams.entries());
  params.sort((a, b) => {
    if (a[0] === b[0]) return a[1].localeCompare(b[1]);
    return a[0].localeCompare(b[0]);
  });
  return params.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

/**
 * Signs an HTTP request using AWS Signature Version 4.
 *
 * @param request - The request details to sign
 * @param date - Optional date override (used for testing)
 * @returns Headers that must be added to the request
 */
export function signRequest(request: SignRequest, date?: Date): SignedHeaders {
  const now = date ?? new Date();
  const dateStamp = getDateStamp(now);
  const amzDate = getAmzDate(now);
  const { method, url, accessKey, secretKey, region } = request;

  // Normalize all header keys to lowercase for consistent lookup
  const headers: Record<string, string> = {};
  for (const [k, v] of Object.entries(request.headers)) {
    headers[k.toLowerCase()] = v;
  }
  headers['host'] = url.host;
  headers['x-amz-date'] = amzDate;
  headers['x-amz-content-sha256'] = UNSIGNED_PAYLOAD;

  // Build canonical headers (sorted, lowercase)
  const sortedHeaderKeys = Object.keys(headers).sort((a, b) => a.localeCompare(b));
  const canonicalHeaders = sortedHeaderKeys
    .map((k) => `${k}:${headers[k]!.trim()}`)
    .join('\n');
  const signedHeaders = sortedHeaderKeys.join(';');

  // Build canonical request
  const canonicalRequest = [
    method,
    url.pathname,
    getCanonicalQueryString(url),
    canonicalHeaders + '\n',
    signedHeaders,
    UNSIGNED_PAYLOAD,
  ].join('\n');

  // Build string to sign
  const credentialScope = `${dateStamp}/${region}/${SERVICE}/aws4_request`;
  const stringToSign = [ALGORITHM, amzDate, credentialScope, sha256(canonicalRequest)].join('\n');

  // Calculate signature
  const signingKey = getSigningKey(secretKey, dateStamp, region);
  const signature = hmacSha256Hex(signingKey, stringToSign);

  // Build authorization header
  const authorization = `${ALGORITHM} Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return {
    'x-amz-date': amzDate,
    'x-amz-content-sha256': UNSIGNED_PAYLOAD,
    Authorization: authorization,
  };
}
