import "server-only";
import { headers } from "next/headers";

// Simple in-memory rate limiter scoped to one server process.
//
// IMPORTANT: this only protects against casual abuse from a single instance.
// On serverless (Vercel) each container has its own Map, so determined
// attackers can bypass it by spreading requests across cold starts. The form
// actions use `createSharedRateLimiter` below, which is backed by Upstash when
// configured and falls back to this.

type Entry = { count: number; reset: number };

interface RateLimitOptions {
  /** Window length in ms. */
  windowMs: number;
  /** Maximum allowed hits per window. */
  max: number;
  /** Hard cap on distinct keys tracked at once. */
  maxKeys?: number;
}

export interface RateLimitResult {
  /** False if the caller should be rejected. */
  allowed: boolean;
  /** Hits left in the current window. */
  remaining: number;
  /** How long until the window resets; 0 when the request was allowed. */
  retryAfterMs: number;
}

export interface RateLimiter {
  /** Records a hit and reports whether it is within the limit. */
  consume: (key: string) => RateLimitResult;
  /** Convenience wrapper: true if the request is allowed. */
  check: (key: string) => boolean;
  /** Drops all tracked keys. Intended for tests. */
  reset: () => void;
}

export function createRateLimiter(opts: RateLimitOptions): RateLimiter {
  const { windowMs, max, maxKeys = 10_000 } = opts;
  const store = new Map<string, Entry>();

  function makeRoom(now: number) {
    if (store.size < maxKeys) return;

    // Expired entries first — they cost nothing to lose.
    for (const [k, v] of store) {
      if (v.reset <= now) store.delete(k);
    }

    // Still full: evict oldest-first (Map iterates in insertion order). This
    // runs on every insert past the cap rather than on a random sample, so a
    // key-spray attack can no longer grow the map without bound.
    while (store.size >= maxKeys) {
      const oldest = store.keys().next();
      if (oldest.done) break;
      store.delete(oldest.value);
    }
  }

  function consume(key: string): RateLimitResult {
    const now = Date.now();
    const entry = store.get(key);

    if (!entry || entry.reset <= now) {
      // Only a genuinely new key can grow the map, so bound it here.
      if (!entry) makeRoom(now);
      store.set(key, { count: 1, reset: now + windowMs });
      return { allowed: true, remaining: max - 1, retryAfterMs: 0 };
    }

    if (entry.count >= max) {
      return { allowed: false, remaining: 0, retryAfterMs: entry.reset - now };
    }

    entry.count += 1;
    return { allowed: true, remaining: max - entry.count, retryAfterMs: 0 };
  }

  return {
    consume,
    check: (key) => consume(key).allowed,
    reset: () => store.clear(),
  };
}

export interface SharedRateLimiter {
  consume: (key: string) => Promise<RateLimitResult>;
}

/**
 * Rate limiter shared across all serverless instances via Upstash Redis
 * (REST API, so no extra dependency), when UPSTASH_REDIS_REST_URL and
 * UPSTASH_REDIS_REST_TOKEN are set. Otherwise — and if Upstash is unreachable —
 * it falls back to the per-process limiter above, so forms never break
 * because of the limiter.
 */
export function createSharedRateLimiter(opts: RateLimitOptions): SharedRateLimiter {
  const local = createRateLimiter(opts);

  return {
    async consume(key) {
      const url = process.env.UPSTASH_REDIS_REST_URL;
      const token = process.env.UPSTASH_REDIS_REST_TOKEN;
      if (!url || !token) return local.consume(key);

      const redisKey = `ratelimit:${key}`;
      try {
        // Fixed window: INCR, start the window on the first hit, read its TTL.
        const res = await fetch(`${url.replace(/\/$/, "")}/pipeline`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify([
            ["INCR", redisKey],
            ["PEXPIRE", redisKey, String(opts.windowMs), "NX"],
            ["PTTL", redisKey],
          ]),
          cache: "no-store",
          signal: AbortSignal.timeout(2000),
        });
        if (!res.ok) throw new Error(`Upstash responded ${res.status}`);

        const [incr, , pttl] = (await res.json()) as { result?: number; error?: string }[];
        const count = Number(incr?.result);
        if (!Number.isFinite(count)) throw new Error(incr?.error ?? "Bad Upstash response");

        if (count > opts.max) {
          const ttl = Number(pttl?.result);
          return { allowed: false, remaining: 0, retryAfterMs: ttl > 0 ? ttl : opts.windowMs };
        }
        return { allowed: true, remaining: opts.max - count, retryAfterMs: 0 };
      } catch (err) {
        console.error("Shared rate limiter unavailable, using in-memory fallback:", err);
        return local.consume(key);
      }
    },
  };
}

/** Rounds a retry delay up to whole minutes for user-facing copy. */
export function retryAfterMinutes(ms: number): number {
  return Math.max(1, Math.ceil(ms / 60_000));
}

/**
 * Best-effort client IP.
 *
 * `x-forwarded-for` is client-spoofable unless a trusted proxy overwrites it,
 * so prefer the platform-controlled headers when they are present.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();

  const candidates = [
    h.get("x-vercel-forwarded-for"),
    h.get("x-real-ip"),
    h.get("x-forwarded-for")?.split(",")[0],
  ];

  for (const c of candidates) {
    const ip = c?.trim();
    if (ip) return ip;
  }
  return "unknown";
}
