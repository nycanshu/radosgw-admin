// ── Cluster info types ────────────────────────────────────────────────────────

export interface RGWStorageBackend {
  /** Backend name (e.g. "rados"). */
  name: string;
  /** The Ceph cluster FSID (unique identifier for the cluster). */
  clusterId: string;
}

export interface RGWClusterInfo {
  info: {
    /** Storage backends available in this cluster. */
    storageBackends: RGWStorageBackend[];
  };
}
