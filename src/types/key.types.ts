/** Input for creating a new S3 or Swift key for a user. */
export interface CreateKeyInput {
  /** User ID to create the key for. Required. */
  uid: string;
  /** Key type. Default: 's3'. */
  keyType?: 's3' | 'swift';
  /** Specify an access key instead of auto-generating. */
  accessKey?: string;
  /**
   * Specify a secret key instead of auto-generating.
   * @remarks This value is transmitted as a query parameter per the RGW Admin Ops API wire
   * format. It is redacted from debug logs by the client.
   */
  secretKey?: string;
  /** Whether to auto-generate the key. Default: true. */
  generateKey?: boolean;
}

/** Input for deleting an S3 or Swift key. */
export interface DeleteKeyInput {
  /** The access key to delete. Required. */
  accessKey: string;
  /** User ID. Required for Swift keys. */
  uid?: string;
  /** Key type. Default: 's3'. */
  keyType?: 's3' | 'swift';
}

/** Input for creating a subuser. */
export interface CreateSubuserInput {
  /** Parent user UID. Required. */
  uid: string;
  /** Subuser ID in `uid:name` format (e.g. `"alice:swift"`). Required. */
  subuser: string;
  /**
   * Secret key for the subuser. Auto-generated if omitted.
   * @remarks This value is transmitted as a query parameter per the RGW Admin Ops API wire
   * format. It is redacted from debug logs by the client.
   */
  secretKey?: string;
  /** Key type for the subuser. */
  keyType?: 'swift' | 's3';
  /** Access level for the subuser. */
  access?: 'read' | 'write' | 'readwrite' | 'full';
  /** Whether to auto-generate a secret. Default: true. */
  generateSecret?: boolean;
}

/** Input for modifying a subuser. */
export interface ModifySubuserInput {
  /** Parent user UID. Required. */
  uid: string;
  /** Subuser ID in `uid:name` format (e.g. `"alice:swift"`). Required. */
  subuser: string;
  /**
   * Secret key for the subuser.
   * @remarks This value is transmitted as a query parameter per the RGW Admin Ops API wire
   * format. It is redacted from debug logs by the client.
   */
  secretKey?: string;
  /** Key type for the subuser. */
  keyType?: 'swift' | 's3';
  /** Updated access level. */
  access?: 'read' | 'write' | 'readwrite' | 'full';
  /** Whether to auto-generate a secret. */
  generateSecret?: boolean;
}

/** Input for deleting a subuser. */
export interface DeleteSubuserInput {
  /** Parent user UID. Required. */
  uid: string;
  /** Subuser ID in `uid:name` format (e.g. `"alice:swift"`). Required. */
  subuser: string;
  /** Whether to also purge the subuser's keys. Default: true. */
  purgeKeys?: boolean;
}
