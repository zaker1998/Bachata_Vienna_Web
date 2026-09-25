"use server";

import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { assertAdmin } from "@/lib/admin-auth";
import { sendStatusUpdateEmail } from "@/lib/email";
import type { BookingRow } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const UpdateBookingStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "confirmed", "cancelled"]),
});

export type UpdateStatusResult =
  | { ok: true; emailed: boolean }
  | { ok: false; error: string };

// Returns a result instead of throwing: in production Next.js replaces thrown
// Server Action errors with a generic message, so the UI couldn't tell
// "session expired" apart from "database down".
export async function updateBookingStatus(
  id: string,
  status: BookingRow["status"]
): Promise<UpdateStatusResult> {
  try {
    await assertAdmin();
  } catch {
    return {
      ok: false,
      error: "Your admin session expired. Reload the page and sign in again.",
    };
  }

  const parsed = UpdateBookingStatusSchema.safeParse({ id, status });
  if (!parsed.success) {
    return { ok: false, error: "Invalid booking status update." };
  }

  const supabase = createAdminClient();

  const { data: existing, error: fetchError } = await supabase
    .from("bookings")
    .select("*")
    .eq("id", parsed.data.id)
    .single();

  if (fetchError || !existing) {
    console.error("Booking lookup failed:", fetchError);
    return { ok: false, error: "Booking not found. It may have been deleted." };
  }

  const previousStatus = existing.status as BookingRow["status"];
  if (previousStatus === parsed.data.status) {
    return { ok: true, emailed: false };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) {
    console.error("Booking status update failed:", error);
    return { ok: false, error: "Couldn't save status. Please try again." };
  }

  revalidatePath("/admin/bookings");

  const nextStatus = parsed.data.status;
  if (nextStatus === "confirmed" || nextStatus === "cancelled") {
    // `existing` was read before the update, so its `status` is still the old
    // one — overlay the new status so the email reflects what was just saved.
    const booking = { ...existing, status: nextStatus } as BookingRow;
    after(async () => {
      try {
        await sendStatusUpdateEmail(booking, nextStatus);
      } catch (err) {
        console.error(`Status-${nextStatus} email failed:`, err);
      }
    });
    return { ok: true, emailed: true };
  }

  return { ok: true, emailed: false };
}
