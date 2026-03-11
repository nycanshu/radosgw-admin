/** Input for creating a new RGW user. */
export interface CreateUserInput {
  /** Unique user ID. Required. Must not contain colons (reserved for subuser notation). */
  uid: string;
  /** Display name for the user. Required. Must not be whitespace-only. */
  displayName: string;
  /** Email address. Basic format validation is applied. */
  email?: string;
  /** Key type to generate. Default: 's3'. */
  keyType?: 's3' | 'swift';
  /** Specify an access key instead of auto-generating. */
  accessKey?: string;
  /**
   * Specify a secret key instead of auto-generating.
   * @remarks This value is transmitted as a query parameter per the RGW Admin Ops API wire
   * format. It is redacted from debug logs by the client.
   */
  secretKey?: string;
  /**
   * User capabilities string. Controls which admin operations the user may perform.
   * Format: `"type=perm"` or `"type1=perm;type2=perm"`.
   * Valid types: `users`, `buckets`, `metadata`, `usage`, `zone`, `info`, `bilog`,
   *   `mdlog`, `datalog`, `user-policy`, `oidc-provider`, `roles`, `ratelimit`.
   * Valid perms: `*`, `read`, `write`, `read, write`.
   * @example `"users=*;buckets=read"`
   */
  userCaps?: string;
  /** Whether to auto-generate a key pair. Default: true. */
  generateKey?: boolean;
  /** Maximum number of buckets allowed. Default: 1000. Use -1 for unlimited. */
  maxBuckets?: number;
  /** Whether the user is suspended on creation. Default: false. */
  suspended?: boolean;
  /** Tenant name for multi-tenancy. */
  tenant?: string;
  /**
   * Operation mask — limits which S3 operations the user can perform.
   * Comma-separated list of operations: `read`, `write`, `delete`, `*`.
   * @example `"read, write"`
   */
  opMask?: string;
}

/** Input for modifying an existing user. */
export interface ModifyUserInput {
  /** User ID to modify. Required. */
  uid: string;
  /** New display name. */
  displayName?: string;
  /** New email address. Basic format validation is applied. */
  email?: string;
  /** Maximum number of buckets. */
  maxBuckets?: number;
  /** Suspend or unsuspend the user. */
  suspended?: boolean;
  /** User capabilities string. See {@link CreateUserInput.userCaps} for format. */
  userCaps?: string;
  /** Operation mask. See {@link CreateUserInput.opMask} for format. */
  opMask?: string;
}

/** Input for deleting a user. */
export interface DeleteUserInput {
  /** User ID to delete. Required. */
  uid: string;
  /** If true, permanently deletes all buckets and objects owned by the user. Default: false. DESTRUCTIVE. */
  purgeData?: boolean;
}

/** An S3 key pair associated with a user. */
export interface RGWKey {
  user: string;
  accessKey: string;
  secretKey: string;
}

/** A Swift key associated with a user. */
export interface RGWSwiftKey {
  user: string;
  secretKey: string;
}

/** A subuser reference. */
export interface RGWSubuser {
  id: string;
  permissions: string;
}

/** A user capability entry. */
export interface RGWCap {
  type: string;
  perm: string;
}

/** Quota configuration (used for both user and bucket quotas). */
export interface RGWQuota {
  enabled: boolean;
  checkOnRaw: boolean;
  /** Quota in bytes. -1 means unlimited. */
  maxSize: number;
  /** Quota in kilobytes. -1 means unlimited. */
  maxSizeKb: number;
  /** Maximum number of objects. -1 means unlimited. */
  maxObjects: number;
}

/** Full RGW user object returned by the admin API. */
export interface RGWUser {
  userId: string;
  displayName: string;
  email: string;
  /**
   * Whether the user is suspended. `0` = active, `1` = suspended.
   * Use numeric comparison: `user.suspended === 1` or treat as truthy/falsy.
   */
  suspended: number;
  maxBuckets: number;
  subusers: RGWSubuser[];
  keys: RGWKey[];
  swiftKeys: RGWSwiftKey[];
  caps: RGWCap[];
  opMask: string;
  defaultPlacement: string;
  defaultStorageClass: string;
  placementTags: string[];
  tenant: string;
  bucketQuota: RGWQuota;
  userQuota: RGWQuota;
  /**
   * User type. Common values: `"rgw"`, `"ldap"`, `"s3"`.
   * May be absent on older Ceph versions.
   */
  type?: string;
  /** MFA device IDs associated with this user. May be absent on older Ceph versions. */
  mfaIds?: string[];
}

/** The raw usage statistics returned by `GET /user?stats=true`. */
export interface RGWUserStatData {
  /** Total bytes used (logical). */
  size: number;
  /** Total bytes actually consumed on disk (accounting for alignment). */
  sizeActual: number;
  /** Total bytes utilized (used + overhead). */
  sizeUtilized: number;
  /** Total kilobytes used (logical). */
  sizeKb: number;
  /** Total kilobytes actually on disk. */
  sizeKbActual: number;
  /** Total kilobytes utilized. */
  sizeKbUtilized: number;
  /** Total number of objects stored. */
  numObjects: number;
}

/**
 * Full user object with embedded storage statistics.
 * Returned by `client.users.getStats()`.
 * Contains all fields from {@link RGWUser} plus a `stats` field.
 */
export interface RGWUserWithStats extends RGWUser {
  stats: RGWUserStatData;
}
