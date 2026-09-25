import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { getServerEnv, resetServerEnvCache } from "@/lib/env";
import { PUBLIC_CONTACT_EMAIL } from "@/lib/constants";

const REQUIRED = {
  NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
  SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
  ADMIN_PASSWORD: "supersecret",
  RESEND_API_KEY: "re_test_123",
};

const saved = { ...process.env };

beforeEach(() => {
  process.env = { ...saved, ...REQUIRED };
  resetServerEnvCache();
});

afterEach(() => {
  process.env = { ...saved };
  resetServerEnvCache();
});

describe("getServerEnv", () => {
  it("parses a complete environment", () => {
    const env = getServerEnv();
    expect(env.SUPABASE_SERVICE_ROLE_KEY).toBe("service-role-key");
    expect(env.ADMIN_USERNAME).toBe("admin");
  });

  it("memoises the parsed result", () => {
    expect(getServerEnv()).toBe(getServerEnv());
  });

  describe("blank values fall back to defaults", () => {
    // Regression: Zod only applies `.default()` for `undefined`, so a blank
    // Vercel var used to fail `.min(1)` and take the whole app down at boot.
    it("for RESEND_FROM_EMAIL", () => {
      process.env.RESEND_FROM_EMAIL = "";
      expect(getServerEnv().RESEND_FROM_EMAIL).toBe("Bachata Vienna <onboarding@resend.dev>");
    });

    it("for a whitespace-only value", () => {
      process.env.RESEND_FROM_EMAIL = "   ";
      expect(getServerEnv().RESEND_FROM_EMAIL).toBe("Bachata Vienna <onboarding@resend.dev>");
    });

    it("for INSTRUCTOR_EMAIL and NEXT_PUBLIC_SITE_URL", () => {
      process.env.INSTRUCTOR_EMAIL = "";
      process.env.NEXT_PUBLIC_SITE_URL = "";
      const env = getServerEnv();
      expect(env.INSTRUCTOR_EMAIL).toBe(PUBLIC_CONTACT_EMAIL);
      expect(env.NEXT_PUBLIC_SITE_URL).toBe("http://localhost:3000");
    });

    it("leaving optional CONTACT_EMAIL undefined rather than invalid", () => {
      process.env.CONTACT_EMAIL = "";
      expect(getServerEnv().CONTACT_EMAIL).toBeUndefined();
    });
  });

  it("still honours real values", () => {
    process.env.RESEND_FROM_EMAIL = "Studio <hi@example.com>";
    process.env.CONTACT_EMAIL = "hi@example.com";
    const env = getServerEnv();
    expect(env.RESEND_FROM_EMAIL).toBe("Studio <hi@example.com>");
    expect(env.CONTACT_EMAIL).toBe("hi@example.com");
  });

  it("throws and names the offending variable when one is missing", () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    expect(() => getServerEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  it("rejects a too-short admin password", () => {
    process.env.ADMIN_PASSWORD = "short";
    expect(() => getServerEnv()).toThrow(/at least 8 characters/);
  });

  it("rejects a malformed Supabase URL", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    expect(() => getServerEnv()).toThrow(/NEXT_PUBLIC_SUPABASE_URL/);
  });
});
