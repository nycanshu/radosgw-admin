/** Input for creating a new RGW user. */
export interface CreateUserInput {
  /** Unique user ID. Required. */
  uid: string;
  /** Display name for the user. Required. */
  displayName: string;
  /** Email address. */
  email?: string;
  /** Key type to generate. Default: 's3'. */
  keyType?: 's3' | 'swift';
  /** Specify an access key instead of auto-generating. */
  accessKey?: string;
  /** Specify a secret key instead of auto-generating. */
  secretKey?: string;
  /** User capabilities, e.g. "users=*;buckets=read". */
  userCaps?: string;
  /** Whether to auto-generate a key. Default: true. */
  generateKey?: boolean;
  /** Maximum number of buckets. Default: 1000, -1 for unlimited. */
  maxBuckets?: number;
  /** Whether the user is suspended on creation. Default: false. */
  suspended?: boolean;
  /** Tenant name for multi-tenancy. */
  tenant?: string;
}

/** Input for modifying an existing user. */
export interface ModifyUserInput {
  /** User ID to modify. Required. */
  uid: string;
  /** New display name. */
  displayName?: string;
  /** New email address. */
  email?: string;
  /** Maximum number of buckets. */
  maxBuckets?: number;
  /** Suspend or enable the user. */
  suspended?: boolean;
  /** User capabilities. */
  userCaps?: string;
  /** Operation mask. */
  opMask?: string;
}

/** Input for deleting a user. */
export interface DeleteUserInput {
  /** User ID to delete. Required. */
  uid: string;
  /** If true, permanently deletes all user data. Default: false. DESTRUCTIVE. */
  purgeData?: boolean;
}

/** Input for getting user storage statistics. */
export interface GetUserStatsInput {
  /** User ID. Required. */
  uid: string;
  /** Sync stats before returning. Default: false. */
  sync?: boolean;
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

/** A user capability. */
export interface RGWCap {
  type: string;
  perm: string;
}

/** Quota configuration (used for both user and bucket quotas). */
export interface RGWQuota {
  enabled: boolean;
  checkOnRaw: boolean;
  maxSize: number;
  maxSizeKb: number;
  maxObjects: number;
}

/** Full RGW user object returned by the admin API. */
export interface RGWUser {
  userId: string;
  displayName: string;
  email: string;
  suspended: number;
  maxBuckets: number;
  subusers: RGWSubuser[];
  keys: RGWKey[];
  swiftKeys: RGWSwiftKey[];
  caps: RGWCap[];
  opMask: string;
  defaultPlacement: string;
  defaultStorageClass: string;
  tenant: string;
  bucketQuota: RGWQuota;
  userQuota: RGWQuota;
}

/** User storage statistics. */
export interface RGWUserStats {
  stats: {
    size: number;
    sizeActual: number;
    sizeUtilized: number;
    sizeKb: number;
    sizeKbActual: number;
    sizeKbUtilized: number;
    numObjects: number;
  };
}
