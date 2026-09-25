import "server-only";
import { createAdminClient } from "@/lib/supabase-admin";
import type { EmailOutcome } from "@/lib/email";
import type { GuestEmailKind } from "@/lib/types";

/**
 * Stores the outcome of a guest email on the booking so the admin dashboard
 * can show it. Never throws: failing to record must not fail the request —
 * e.g. before the 20260925 migration is applied the columns don't exist yet.
 */
export async function recordGuestEmail(
  bookingId: string,
  kind: GuestEmailKind,
  outcome: EmailOutcome,
  /** Current `emailed_statuses`; the new status is appended on success. */
  emailedStatuses: string[] = []
): Promise<void> {
  const update: Record<string, unknown> = {
    email_status: outcome.ok ? "sent" : "failed",
    email_kind: kind,
    email_error: outcome.ok ? null : outcome.error.slice(0, 500),
    email_at: new Date().toISOString(),
  };
  if (outcome.ok && kind !== "received" && !emailedStatuses.includes(kind)) {
    update.emailed_statuses = [...emailedStatuses, kind];
  }

  try {
    const { error } = await createAdminClient()
      .from("bookings")
      .update(update)
      .eq("id", bookingId);
    if (error) console.error("Couldn't record guest email outcome:", error);
  } catch (err) {
    console.error("Couldn't record guest email outcome:", err);
  }
}
