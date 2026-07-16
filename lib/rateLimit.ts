const MESSAGE_WINDOW_MS = 10_000; // 10s window
const MESSAGE_LIMIT = 6; // allow 6 sends per window

type Entry = { timestamps: number[] };

const store = new Map<string, Entry>();

export function allowSend(userId: string) {
  const now = Date.now();
  const entry = store.get(userId) ?? { timestamps: [] };
  // remove old timestamps
  entry.timestamps = entry.timestamps.filter((t) => t > now - MESSAGE_WINDOW_MS);
  if (entry.timestamps.length >= MESSAGE_LIMIT) {
    store.set(userId, entry);
    return false;
  }
  entry.timestamps.push(now);
  store.set(userId, entry);
  return true;
}

export function resetRateLimit(userId: string) {
  store.delete(userId);
}

export function getRateLimitInfo(userId: string) {
  const now = Date.now();
  const entry = store.get(userId) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => t > now - MESSAGE_WINDOW_MS);
  return {
    windowMs: MESSAGE_WINDOW_MS,
    limit: MESSAGE_LIMIT,
    remaining: Math.max(0, MESSAGE_LIMIT - entry.timestamps.length),
  };
}

export default { allowSend, resetRateLimit, getRateLimitInfo };
