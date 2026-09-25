import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetServerEnvCache } from "@/lib/env";
import { PUBLIC_CONTACT_EMAIL } from "@/lib/constants";
import type { BookingInsert, BookingRow } from "@/lib/types";

const send = vi.fn<(payload: Record<string, unknown>) => Promise<unknown>>(async () => ({
  data: {},
  error: null,
}));

vi.mock("resend", () => ({
  Resend: class {
    emails = { send };
  },
}));

const { sendBookingEmails, sendStatusUpdateEmail } = await import("@/lib/email");

const saved = { ...process.env };

beforeEach(() => {
  process.env = {
    ...saved,
    NEXT_PUBLIC_SUPABASE_URL: "https://proj.supabase.co",
    SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    ADMIN_PASSWORD: "supersecret",
    RESEND_API_KEY: "re_test_123",
    RESEND_FROM_EMAIL: "Bachata Vienna <noreply@example.com>",
    INSTRUCTOR_EMAIL: "instructor@example.com",
    REPLY_TO_EMAIL: "",
  };
  resetServerEnvCache();
  send.mockClear();
});

afterEach(() => {
  process.env = { ...saved };
  resetServerEnvCache();
});

const insert: BookingInsert = {
  user_name: "Ana María",
  user_email: "ana@example.com",
  whatsapp_number: "+43 660 1234567",
  class_type: "private",
  preferred_date: "2026-09-01",
  preferred_time: "18:00",
  secondary_date: "2026-09-02",
  secondary_time: "19:00",
};

const row: BookingRow = {
  ...insert,
  id: "11111111-1111-4111-8111-111111111111",
  status: "confirmed",
  created_at: "2026-08-01T10:00:00Z",
};

const payloadTo = (to: string) =>
  send.mock.calls.map(([p]) => p).find((p) => p.to === to);

describe("reply-to headers", () => {
  // Regression: guests were told to "reply to this email", but replies went
  // to the no-reply sender and were lost.
  it("routes guest replies to the public contact address", async () => {
    await sendBookingEmails(insert);
    expect(payloadTo("ana@example.com")?.replyTo).toBe(PUBLIC_CONTACT_EMAIL);
  });

  it("lets the instructor reply straight to the guest", async () => {
    await sendBookingEmails(insert);
    expect(payloadTo("instructor@example.com")?.replyTo).toBe("ana@example.com");
  });

  it("sets reply-to on status updates", async () => {
    await sendStatusUpdateEmail(row, "confirmed");
    expect(payloadTo("ana@example.com")?.replyTo).toBe(PUBLIC_CONTACT_EMAIL);
  });

  it("honours REPLY_TO_EMAIL when set", async () => {
    process.env.REPLY_TO_EMAIL = "hello@example.com";
    resetServerEnvCache();
    await sendStatusUpdateEmail(row, "cancelled");
    expect(payloadTo("ana@example.com")?.replyTo).toBe("hello@example.com");
  });
});
