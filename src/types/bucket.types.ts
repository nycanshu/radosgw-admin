import type { RGWQuota } from './user.types.js';

/** Usage statistics for a bucket storage class. */
export interface RGWBucketUsage {
  size: number;
  sizeActual: number;
  sizeUtilized: number;
  sizeKb: number;
  sizeKbActual: number;
  numObjects: number;
}

/** Full RGW bucket object returned by the admin API. */
export interface RGWBucket {
  bucket: string;
  tenant: string;
  explicitTenant: boolean;
  id: string;
  marker: string;
  indexType: string;
  owner: string;
  ver: string;
  masterVer: string;
  mtime: string;
  creationTime: string;
  maxMarker: string;
  usage: {
    rgwMain: RGWBucketUsage;
    rgwMultimeta?: RGWBucketUsage;
    [storageClass: string]: RGWBucketUsage | undefined;
  };
  bucketQuota: RGWQuota;
}

/** Input for deleting a bucket. */
export interface DeleteBucketInput {
  /** Bucket name. Required. */
  bucket: string;
  /** If true, permanently deletes all objects in the bucket. Default: false. DESTRUCTIVE. */
  purgeObjects?: boolean;
}

/** Input for linking a bucket to a user. */
export interface LinkBucketInput {
  /** Bucket name. Required. */
  bucket: string;
  /** Bucket ID (from getInfo). Required. */
  bucketId: string;
  /** User ID to link the bucket to. Required. */
  uid: string;
}

/** Input for unlinking a bucket from a user. */
export interface UnlinkBucketInput {
  /** Bucket name. Required. */
  bucket: string;
  /** User ID to unlink the bucket from. Required. */
  uid: string;
}

/** Input for checking/repairing a bucket index. */
export interface CheckBucketIndexInput {
  /** Bucket name. Required. */
  bucket: string;
  /** Whether to check object data consistency. Default: false. */
  checkObjects?: boolean;
  /** Whether to fix any detected issues. Default: false (dry run). */
  fix?: boolean;
}

/** Result of a bucket index check. */
export interface CheckBucketIndexResult {
  invalidMultipartEntries: string[];
  checkResult: {
    existingHeader: Record<string, unknown>;
    calculatedHeader: Record<string, unknown>;
  };
}
