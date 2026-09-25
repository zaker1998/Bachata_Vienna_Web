import { beforeEach, describe, expect, it, vi } from "vitest";
import type { BookingRow } from "@/lib/types";

const m = vi.hoisted(() => ({
  row: null as unknown as Record<string, unknown>,
  updates: [] as Record<string, unknown>[],
  admin: true,
  sendStatus: vi.fn(),
  record: vi.fn(),
}));

vi.mock("@/lib/admin-auth", () => ({
  assertAdmin: async () => {
    if (!m.admin) throw new Error("Unauthorized");
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));
vi.mock("@/lib/booking-email-log", () => ({ recordGuestEmail: m.record }));
vi.mock("@/lib/email", () => ({
  sendStatusUpdateEmail: m.sendStatus,
  sendGuestReceivedEmail: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/lib/supabase-admin", () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({ eq: () => ({ single: async () => ({ data: m.row, error: null }) }) }),
      update: (u: Record<string, unknown>) => {
        m.updates.push(u);
        return { eq: async () => ({ error: null }) };
      },
    }),
  }),
}));

const { updateBookingStatus, updateBookingNotes } = await import("@/app/admin/bookings/actions");

const ID = "11111111-1111-4111-8111-111111111111";
const baseRow: BookingRow = {
  id: ID,
  status: "pending",
  created_at: "2026-09-01T10:00:00Z",
  user_name: "Ana",
  user_email: "ana@example.com",
  whatsapp_number: "+436601234567",
  class_type: "private",
  preferred_date: "2026-10-01",
  preferred_time: "18:00",
  secondary_date: "2026-10-02",
  secondary_time: "19:00",
  emailed_statuses: [],
};

beforeEach(() => {
  m.row = { ...baseRow };
  m.updates = [];
  m.admin = true;
  m.sendStatus.mockReset().mockResolvedValue({ ok: true });
  m.record.mockReset();
});

describe("updateBookingStatus", () => {
  it("emails the guest and records the outcome on first confirmation", async () => {
    expect(await updateBookingStatus(ID, "confirmed")).toEqual({ ok: true, email: "sent" });
    expect(m.sendStatus).toHaveBeenCalledOnce();
    expect(m.record).toHaveBeenCalledWith(ID, "confirmed", { ok: true }, []);
  });

  it("doesn't email again for a status the guest was already emailed about", async () => {
    m.row = { ...baseRow, emailed_statuses: ["confirmed"] };
    expect(await updateBookingStatus(ID, "confirmed")).toEqual({ ok: true, email: "skipped" });
    expect(m.sendStatus).not.toHaveBeenCalled();
    expect(m.updates).toEqual([{ status: "confirmed" }]);
  });

  it("reports a failed email instead of hiding it", async () => {
    m.sendStatus.mockResolvedValue({ ok: false, error: "API key is invalid" });
    expect(await updateBookingStatus(ID, "cancelled")).toEqual({ ok: true, email: "failed" });
  });

  it("sends nothing when moving back to pending", async () => {
    m.row = { ...baseRow, status: "confirmed" };
    expect(await updateBookingStatus(ID, "pending")).toEqual({ ok: true, email: "none" });
    expect(m.sendStatus).not.toHaveBeenCalled();
  });

  it("refuses without admin credentials", async () => {
    m.admin = false;
    const result = await updateBookingStatus(ID, "confirmed");
    expect(result.ok).toBe(false);
    expect(m.updates).toEqual([]);
  });
});

describe("updateBookingNotes", () => {
  it("trims notes and stores blanks as null", async () => {
    expect(await updateBookingNotes(ID, "  call after 6pm  ")).toEqual({ ok: true });
    expect(await updateBookingNotes(ID, "   ")).toEqual({ ok: true });
    expect(m.updates).toEqual([{ notes: "call after 6pm" }, { notes: null }]);
  });

  it("rejects overly long notes", async () => {
    const result = await updateBookingNotes(ID, "x".repeat(2001));
    expect(result.ok).toBe(false);
  });
});
