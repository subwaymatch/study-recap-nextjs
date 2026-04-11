/**
 * Simple in-memory sliding-window rate limiter for server-side use.
 * Tracks request timestamps per IP and rejects requests exceeding the limit.
 */

interface RateLimiterOptions {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Time window in milliseconds. */
  windowMs: number;
}

const ipRequests = new Map<string, number[]>();

// Periodically clean up stale entries to prevent memory leaks.
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup(windowMs: number) {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  const cutoff = now - windowMs;
  for (const [ip, timestamps] of ipRequests) {
    const filtered = timestamps.filter((t) => t > cutoff);
    if (filtered.length === 0) {
      ipRequests.delete(ip);
    } else {
      ipRequests.set(ip, filtered);
    }
  }
}

export function checkRateLimit(
  ip: string,
  { maxRequests, windowMs }: RateLimiterOptions,
): { allowed: boolean; retryAfterMs: number } {
  cleanup(windowMs);
  const now = Date.now();
  const cutoff = now - windowMs;
  const timestamps = (ipRequests.get(ip) ?? []).filter((t) => t > cutoff);

  if (timestamps.length >= maxRequests) {
    const oldestInWindow = timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;
    return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1000) };
  }

  timestamps.push(now);
  ipRequests.set(ip, timestamps);
  return { allowed: true, retryAfterMs: 0 };
}
