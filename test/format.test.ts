import { describe, expect, it } from "vitest";
import { formatDay, formatPhone, telLink, timeAgo, whatsappLink, whatsappMessage } from "@/lib/format";

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

describe("whatsappLink with a message", () => {
  it("URL-encodes the pre-filled text", () => {
    expect(whatsappLink("+43 660 1234567", "Hi Ana! 18:00?")).toBe(
      "https://wa.me/436601234567?text=Hi%20Ana!%2018%3A00%3F"
    );
  });
});

describe("whatsappMessage", () => {
  const booking = {
    user_name: "Ana María Fernández",
    class_type: "private" as const,
    status: "pending" as const,
    preferred_date: "2026-09-01",
    preferred_time: "18:00",
    secondary_date: "2026-09-02",
    secondary_time: "19:00",
  };

  it("asks which slot works while pending, using the first name", () => {
    const msg = whatsappMessage(booking);
    expect(msg).toMatch(/^Hi Ana! Thanks for your Bachata private lesson request/);
    expect(msg).toContain("Tue, 1 Sep");
    expect(msg).toContain("at 18:00");
    expect(msg).toMatch(/or would you prefer Wed, 2 Sep.* at 19:00\?$/);
  });

  it("confirms the slot once confirmed", () => {
    expect(whatsappMessage({ ...booking, status: "confirmed" })).toMatch(/is confirmed for Tue, 1 Sep/);
  });

  it("handles legacy bookings without a second slot", () => {
    const msg = whatsappMessage({ ...booking, secondary_date: null, secondary_time: null });
    expect(msg).toMatch(/at 18:00 work for you\?$/);
  });
});

describe("formatPhone", () => {
  it("spaces out numbers with a known country code", () => {
    expect(formatPhone("+436601234567")).toBe("+43 660 1234567");
    expect(formatPhone("+491512345678")).toBe("+49 151 2345678");
  });

  it("leaves other numbers as stored", () => {
    expect(formatPhone("+15551234567")).toBe("+15551234567");
    expect(formatPhone("0660 7654321")).toBe("0660 7654321");
  });
});

describe("telLink", () => {
  it("keeps the leading plus and strips formatting", () => {
    expect(telLink("+43 (660) 123-4567")).toBe("tel:+436601234567");
    expect(telLink("0660 1234567")).toBe("tel:06601234567");
  });
});
