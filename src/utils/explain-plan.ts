const INDEX_STAGES = new Set(["IXSCAN", "EXPRESS_IXSCAN"]);

/** Walk an explain result. Skips rejectedPlans so only the chosen plan counts. */
export function containsIxscan(node: unknown): boolean {
  if (Array.isArray(node)) return node.some((item) => containsIxscan(item));
  if (!node || typeof node !== "object") return false;

  const record = node as Record<string, unknown>;
  if (typeof record.stage === "string" && INDEX_STAGES.has(record.stage)) return true;

  return Object.entries(record).some(
    ([key, value]) => key !== "rejectedPlans" && containsIxscan(value),
  );
}

/** MongoDB 8 reports $lookup index use as indexesUsed rather than a nested IXSCAN stage. */
export function lookupUsesIndex(node: unknown, indexName: string): boolean {
  if (Array.isArray(node)) return node.some((item) => lookupUsesIndex(item, indexName));
  if (!node || typeof node !== "object") return false;

  const record = node as Record<string, unknown>;
  if (
    record.$lookup &&
    record.collectionScans === 0 &&
    Array.isArray(record.indexesUsed) &&
    record.indexesUsed.includes(indexName)
  ) {
    return true;
  }

  return Object.entries(record).some(
    ([key, value]) => key !== "rejectedPlans" && lookupUsesIndex(value, indexName),
  );
}
