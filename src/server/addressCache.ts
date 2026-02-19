type CacheItem = {
  data: any;
  expiresAt: number;
};

const cache = new Map<string, CacheItem>();

export function getCached(key: string) {
  const item = cache.get(key);
  if (!item) return null;

  if (Date.now() > item.expiresAt) {
    cache.delete(key);
    return null;
  }

  return item.data;
}

export function setCached(key: string, data: any, ttlMs = 60_000) {
  cache.set(key, {
    data,
    expiresAt: Date.now() + ttlMs,
  });
}
