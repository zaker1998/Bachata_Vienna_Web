import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({ headers: async () => new Headers() }));

import { createSharedRateLimiter } from "@/lib/rate-limit";

const saved = { ...process.env };
const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  process.env = { ...saved };
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const upstashReply = (count: number, ttl = 30_000) =>
  new Response(JSON.stringify([{ result: count }, { result: 1 }, { result: ttl }]));

describe("createSharedRateLimiter", () => {
  it("uses the in-memory limiter when Upstash isn't configured", async () => {
    delete process.env.UPSTASH_REDIS_REST_URL;
    delete process.env.UPSTASH_REDIS_REST_TOKEN;
    const limiter = createSharedRateLimiter({ windowMs: 60_000, max: 1 });

    expect((await limiter.consume("a")).allowed).toBe(true);
    expect((await limiter.consume("a")).allowed).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  describe("with Upstash configured", () => {
    beforeEach(() => {
      process.env.UPSTASH_REDIS_REST_URL = "https://example.upstash.io/";
      process.env.UPSTASH_REDIS_REST_TOKEN = "token";
    });

    it("counts hits in Redis and blocks past the limit", async () => {
      const limiter = createSharedRateLimiter({ windowMs: 60_000, max: 2 });

      fetchMock.mockResolvedValueOnce(upstashReply(2));
      expect(await limiter.consume("ip")).toMatchObject({ allowed: true, remaining: 0 });

      fetchMock.mockResolvedValueOnce(upstashReply(3, 12_000));
      expect(await limiter.consume("ip")).toEqual({
        allowed: false,
        remaining: 0,
        retryAfterMs: 12_000,
      });

      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe("https://example.upstash.io/pipeline");
      expect(init.headers.Authorization).toBe("Bearer token");
      expect(JSON.parse(init.body)[0]).toEqual(["INCR", "ratelimit:ip"]);
    });

    it("falls back to in-memory limiting if Upstash is down", async () => {
      const limiter = createSharedRateLimiter({ windowMs: 60_000, max: 1 });
      fetchMock.mockRejectedValue(new Error("network down"));

      expect((await limiter.consume("ip")).allowed).toBe(true);
      expect((await limiter.consume("ip")).allowed).toBe(false);
    });
  });
});
