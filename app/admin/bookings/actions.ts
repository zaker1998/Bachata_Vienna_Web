"use server";

import { createAdminClient } from "@/lib/supabase-admin";
import { assertAdmin } from "@/lib/admin-auth";
import {
  sendGuestReceivedEmail,
  sendStatusUpdateEmail,
  type EmailOutcome,
} from "@/lib/email";
import { recordGuestEmail } from "@/lib/booking-email-log";
import type { BookingInsert, BookingRow, GuestEmailKind } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const BookingId = z.string().uuid();

const UpdateBookingStatusSchema = z.object({
  id: BookingId,
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

/**
 * What happened to the guest email:
 * - `sent` / `failed`: an email was attempted
 * - `skipped`: the guest was already emailed about this status earlier
 * - `none`: this status change doesn't email the guest
 */
export type EmailResult = "sent" | "failed" | "skipped" | "none";

export type UpdateStatusResult =
  | { ok: true; email: EmailResult }
  | { ok: false; error: string };

export type ActionResult = { ok: true } | { ok: false; error: string };

const SESSION_EXPIRED = "Your admin session expired. Reload the page and sign in again.";

// Admin actions return results instead of throwing: in production Next.js
// replaces thrown Server Action errors with a generic message, so the UI
// couldn't tell "session expired" apart from "database down".
async function isAdmin(): Promise<boolean> {
  try {
    await assertAdmin();
    return true;
  } catch {
    return false;
  }
}

async function loadBooking(id: string): Promise<BookingRow | null> {
  const { data, error } = await createAdminClient()
    .from("bookings")
    .select("*")
    .eq("id", id)
    .single();
  if (error) console.error("Booking lookup failed:", error);
  return (data as BookingRow | null) ?? null;
}

/** Sends the email matching `kind` and records the outcome on the booking. */
async function emailGuest(booking: BookingRow, kind: GuestEmailKind): Promise<EmailOutcome> {
  let outcome: EmailOutcome;
  if (kind === "received") {
    const insert = asInsert(booking);
    outcome = insert
      ? await sendGuestReceivedEmail(insert)
      : { ok: false, error: "This booking predates time slots — message the guest directly." };
  } else {
    outcome = await sendStatusUpdateEmail({ ...booking, status: kind }, kind);
  }
  await recordGuestEmail(booking.id, kind, outcome, booking.emailed_statuses ?? []);
  return outcome;
}

function asInsert(b: BookingRow): BookingInsert | null {
  if (!b.preferred_time || !b.secondary_date || !b.secondary_time) return null;
  return {
    user_name: b.user_name,
    user_email: b.user_email,
    whatsapp_number: b.whatsapp_number,
    class_type: b.class_type,
    preferred_date: b.preferred_date,
    preferred_time: b.preferred_time,
    secondary_date: b.secondary_date,
    secondary_time: b.secondary_time,
  };
}

export async function updateBookingStatus(
  id: string,
  status: BookingRow["status"]
): Promise<UpdateStatusResult> {
  if (!(await isAdmin())) return { ok: false, error: SESSION_EXPIRED };

  const parsed = UpdateBookingStatusSchema.safeParse({ id, status });
  if (!parsed.success) {
    return { ok: false, error: "Invalid booking status update." };
  }

  const existing = await loadBooking(parsed.data.id);
  if (!existing) {
    return { ok: false, error: "Booking not found. It may have been deleted." };
  }

  const nextStatus = parsed.data.status;
  if (existing.status === nextStatus) {
    return { ok: true, email: "none" };
  }

  const { error } = await createAdminClient()
    .from("bookings")
    .update({ status: nextStatus })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("Booking status update failed:", error);
    return { ok: false, error: "Couldn't save status. Please try again." };
  }

  let email: EmailResult = "none";
  if (nextStatus === "confirmed" || nextStatus === "cancelled") {
    if ((existing.emailed_statuses ?? []).includes(nextStatus)) {
      // Toggling back and forth shouldn't send the guest the same email twice.
      // A deliberate re-send is still possible via "Resend email".
      email = "skipped";
    } else {
      // Awaited (not `after`) so the admin sees whether it actually went out.
      const outcome = await emailGuest({ ...existing, status: nextStatus }, nextStatus);
      email = outcome.ok ? "sent" : "failed";
    }
  }

  revalidatePath("/admin/bookings");
  return { ok: true, email };
}

/** Re-sends the guest email that matches the booking's current status. */
export async function resendGuestEmail(id: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: SESSION_EXPIRED };
  if (!BookingId.safeParse(id).success) return { ok: false, error: "Invalid booking." };

  const booking = await loadBooking(id);
  if (!booking) return { ok: false, error: "Booking not found. It may have been deleted." };

  const kind: GuestEmailKind = booking.status === "pending" ? "received" : booking.status;
  const outcome = await emailGuest(booking, kind);

  revalidatePath("/admin/bookings");
  return outcome.ok ? { ok: true } : { ok: false, error: `Email failed: ${outcome.error}` };
}

const NotesSchema = z.object({
  id: BookingId,
  notes: z.string().max(2000, "Notes are limited to 2000 characters."),
});

export async function updateBookingNotes(id: string, notes: string): Promise<ActionResult> {
  if (!(await isAdmin())) return { ok: false, error: SESSION_EXPIRED };

  const parsed = NotesSchema.safeParse({ id, notes });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid notes." };
  }

  const trimmed = parsed.data.notes.trim();
  const { error } = await createAdminClient()
    .from("bookings")
    .update({ notes: trimmed === "" ? null : trimmed })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("Saving notes failed:", error);
    // 42703 / PGRST204: column missing — the migration hasn't been applied.
    const missingColumn = error.code === "42703" || error.code === "PGRST204";
    return {
      ok: false,
      error: missingColumn
        ? "Notes need the latest database migration (supabase db push)."
        : "Couldn't save notes. Please try again.",
    };
  }

  revalidatePath("/admin/bookings");
  return { ok: true };
}
