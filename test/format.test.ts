import { describe, expect, it } from "vitest";
import { formatDay, telLink, timeAgo, whatsappLink } from "@/lib/format";

describe("formatDay", () => {
  it("formats a calendar day without timezone drift", () => {
    expect(formatDay("2026-09-01")).toMatch(/^Tue, 1 Sep/);
  });
});

describe("timeAgo", () => {
  const now = new Date("2026-09-10T12:00:00Z");

  it("handles very recent timestamps", () => {
    expect(timeAgo("2026-09-10T11:59:40Z", now)).toBe("just now");
  });

  it("uses minutes, hours and days", () => {
    expect(timeAgo("2026-09-10T11:45:00Z", now)).toBe("15 minutes ago");
    expect(timeAgo("2026-09-10T09:00:00Z", now)).toBe("3 hours ago");
    expect(timeAgo("2026-09-09T12:00:00Z", now)).toBe("yesterday");
  });

  it("falls back to a date for old timestamps", () => {
    expect(timeAgo("2026-05-01T12:00:00Z", now)).toMatch(/2026/);
  });
});

describe("whatsappLink", () => {
  it("builds a wa.me link from international numbers", () => {
    expect(whatsappLink("+43 660 123-4567")).toBe("https://wa.me/436601234567");
    expect(whatsappLink("0043 660 1234567")).toBe("https://wa.me/436601234567");
  });

  it("returns null for local numbers wa.me can't resolve", () => {
    expect(whatsappLink("0660 1234567")).toBeNull();
  });
});

describe("telLink", () => {
  it("keeps the leading plus and strips formatting", () => {
    expect(telLink("+43 (660) 123-4567")).toBe("tel:+436601234567");
    expect(telLink("0660 1234567")).toBe("tel:06601234567");
  });
});
