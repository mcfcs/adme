export const CLUSTER_NAMES = {
  "COA-M": "Council of Organizations of the Ateneo",
  LIONS: "League of Independent Organizations",
};

export function clusterName(cluster) {
  if (CLUSTER_NAMES[cluster]) {
    return CLUSTER_NAMES[cluster];
  }
  return cluster;
}
