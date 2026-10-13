// Concurrent calls with the same key share one in-flight promise, so two
// simultaneous status requests for one application cannot both transmit to
// iPeak (the database "already submitted" check alone is racy).
const inflight = new Map<string, Promise<unknown>>();

export function singleFlight<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;
  const p = fn().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
