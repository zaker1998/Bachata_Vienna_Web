import { describe, expect, it } from "vitest";
import {
  BOOKING_FIELDS,
  BookingSchema,
  CONTACT_FIELDS,
  ContactSchema,
  VALID_TIMES,
  collectFieldErrors,
  todayInVienna,
} from "@/lib/validation";

const daysFromNow = (n: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

const validBooking = () => ({
  user_name: "  Ana María  ",
  user_email: "  Ana@Example.COM  ",
  whatsapp_number: "+43 660 1234567",
  class_type: "private",
  preferred_date: daysFromNow(3),
  preferred_time: "18:00",
  secondary_date: daysFromNow(4),
  secondary_time: "19:00",
});

/** First error message recorded against `field`, if any. */
const errorFor = (result: ReturnType<typeof BookingSchema.safeParse>, field: string) =>
  result.success
    ? undefined
    : result.error.issues.find((i) => i.path[0] === field)?.message;

describe("todayInVienna", () => {
  it("returns an ISO date", () => {
    expect(todayInVienna()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("VALID_TIMES", () => {
  it("covers 08:00 through 22:00 on the hour", () => {
    expect(VALID_TIMES[0]).toBe("08:00");
    expect(VALID_TIMES.at(-1)).toBe("22:00");
    expect(VALID_TIMES).toHaveLength(15);
  });
});

describe("BookingSchema", () => {
  it("accepts a valid booking and normalises name and email", () => {
    const result = BookingSchema.safeParse(validBooking());
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.user_name).toBe("Ana María");
    expect(result.data.user_email).toBe("ana@example.com");
  });

  it("accepts today in Vienna", () => {
    const result = BookingSchema.safeParse({
      ...validBooking(),
      preferred_date: todayInVienna(),
    });
    expect(result.success).toBe(true);
  });

  it("rejects a date in the past", () => {
    const result = BookingSchema.safeParse({
      ...validBooking(),
      preferred_date: daysFromNow(-2),
    });
    expect(errorFor(result, "preferred_date")).toBe("Date must be today or later.");
  });

  it("rejects a date more than a year out", () => {
    const result = BookingSchema.safeParse({
      ...validBooking(),
      preferred_date: daysFromNow(400),
      secondary_date: daysFromNow(401),
    });
    expect(errorFor(result, "preferred_date")).toBe("That date is too far in the future.");
  });

  it("rejects a malformed date", () => {
    const result = BookingSchema.safeParse({ ...validBooking(), preferred_date: "22-08-2026" });
    expect(errorFor(result, "preferred_date")).toBe("Please pick a valid date.");
  });

  it("rejects a time outside the bookable hours", () => {
    const result = BookingSchema.safeParse({ ...validBooking(), preferred_time: "07:00" });
    expect(errorFor(result, "preferred_time")).toBe("Please pick a valid time.");
  });

  it("rejects a secondary slot identical to the primary one", () => {
    const day = daysFromNow(3);
    const result = BookingSchema.safeParse({
      ...validBooking(),
      preferred_date: day,
      preferred_time: "18:00",
      secondary_date: day,
      secondary_time: "18:00",
    });
    expect(errorFor(result, "secondary_date")).toBe(
      "Secondary slot must differ from the primary slot."
    );
  });

  it("allows the same day at a different time", () => {
    const day = daysFromNow(3);
    const result = BookingSchema.safeParse({
      ...validBooking(),
      preferred_date: day,
      preferred_time: "18:00",
      secondary_date: day,
      secondary_time: "20:00",
    });
    expect(result.success).toBe(true);
  });

  it("normalizes WhatsApp numbers to international format", () => {
    const parse = (whatsapp_number: string) =>
      BookingSchema.safeParse({ ...validBooking(), whatsapp_number });
    const value = (n: string) => {
      const r = parse(n);
      return r.success ? r.data.whatsapp_number : null;
    };
    expect(value("+43 660 123-4567")).toBe("+436601234567");
    expect(value("0043 660 1234567")).toBe("+436601234567");
    // National Austrian numbers get +43, since that's where guests are.
    expect(value("0660 1234567")).toBe("+436601234567");
    expect(value("+49 (151) 2345678")).toBe("+491512345678");
  });

  it("asks for a country code when one can't be inferred", () => {
    expect(
      errorFor(BookingSchema.safeParse({ ...validBooking(), whatsapp_number: "660 1234567" }), "whatsapp_number")
    ).toMatch(/country code/);
  });

  it("rejects an unusable WhatsApp number", () => {
    expect(
      errorFor(BookingSchema.safeParse({ ...validBooking(), whatsapp_number: "call me" }), "whatsapp_number")
    ).toBe("Please enter a valid WhatsApp number.");
  });

  it("rejects a one-character name and an unknown class type", () => {
    expect(errorFor(BookingSchema.safeParse({ ...validBooking(), user_name: "A" }), "user_name")).toBe(
      "Please enter your full name."
    );
    expect(errorFor(BookingSchema.safeParse({ ...validBooking(), class_type: "solo" }), "class_type")).toBe(
      "Please pick a class type."
    );
  });
});

describe("ContactSchema", () => {
  const valid = { name: "Ana", email: "ANA@example.com ", message: "Hello there, I have a question." };

  it("accepts a valid message and lowercases the email", () => {
    const result = ContactSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("ana@example.com");
  });

  it("rejects a too-short message", () => {
    const result = ContactSchema.safeParse({ ...valid, message: "hi" });
    expect(result.success).toBe(false);
  });

  it("rejects a message over the length cap", () => {
    const result = ContactSchema.safeParse({ ...valid, message: "x".repeat(4001) });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = ContactSchema.safeParse({ ...valid, email: "not-an-email" });
    expect(result.success).toBe(false);
  });
});

describe("collectFieldErrors", () => {
  it("keeps the first message per field and drops unknown fields", () => {
    const issues = [
      { path: ["user_name"], message: "first" },
      { path: ["user_name"], message: "second" },
      { path: ["not_a_field"], message: "ignored" },
      { path: [], message: "form-level" },
    ];
    expect(collectFieldErrors(issues, BOOKING_FIELDS)).toEqual({ user_name: "first" });
  });

  it("returns an empty object when nothing matches", () => {
    expect(collectFieldErrors([{ path: ["nope"], message: "x" }], CONTACT_FIELDS)).toEqual({});
  });

  it("maps a real schema failure onto its field", () => {
    const result = ContactSchema.safeParse({ name: "A", email: "bad", message: "short" });
    expect(result.success).toBe(false);
    if (result.success) return;
    const errors = collectFieldErrors(result.error.issues, CONTACT_FIELDS);
    expect(Object.keys(errors).sort()).toEqual(["email", "message", "name"]);
  });
});
