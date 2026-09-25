"use server";

import { after } from "next/server";
import { createAdminClient } from "@/lib/supabase-admin";
import { sendGuestReceivedEmail, sendInstructorNotification } from "@/lib/email";
import { recordGuestEmail } from "@/lib/booking-email-log";
import {
  createSharedRateLimiter,
  getClientIp,
  retryAfterMinutes,
} from "@/lib/rate-limit";
import {
  BOOKING_FIELDS,
  BookingSchema,
  collectFieldErrors,
  submittedValues,
  type BookingField,
} from "@/lib/validation";
import type { BookingInsert } from "@/lib/types";

export interface BookingResult {
  success: boolean;
  message: string;
  fieldErrors?: Partial<Record<BookingField, string>>;
  /** What the guest typed, so the form can be refilled after an error. */
  values?: Partial<Record<BookingField, string>>;
}

const SUCCESS_MESSAGE = "Booking submitted! We'll confirm your spot shortly.";

const bookingRateLimiter = createSharedRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
});

export async function createBooking(formData: FormData): Promise<BookingResult> {
  const values = submittedValues(formData, BOOKING_FIELDS);

  const ip = await getClientIp();
  const limit = await bookingRateLimiter.consume(`booking:${ip}`);
  if (!limit.allowed) {
    const mins = retryAfterMinutes(limit.retryAfterMs);
    return {
      success: false,
      message: `Too many booking attempts. Please try again in ${mins} minute${mins === 1 ? "" : "s"}.`,
      values,
    };
  }

  // Honeypot — checked before validation so bots get a plausible success
  // response instead of a validation error revealing the trap.
  if (formData.get("website")) {
    return { success: true, message: SUCCESS_MESSAGE };
  }

  const parsed = BookingSchema.safeParse({
    user_name: formData.get("user_name"),
    user_email: formData.get("user_email"),
    whatsapp_number: formData.get("whatsapp_number"),
    class_type: formData.get("class_type"),
    preferred_date: formData.get("preferred_date"),
    preferred_time: formData.get("preferred_time"),
    secondary_date: formData.get("secondary_date"),
    secondary_time: formData.get("secondary_time"),
  });

  if (!parsed.success) {
    return {
      success: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: collectFieldErrors(parsed.error.issues, BOOKING_FIELDS),
      values,
    };
  }

  const booking: BookingInsert = parsed.data;

  const supabase = createAdminClient();
  const { data: inserted, error } = await supabase
    .from("bookings")
    .insert(booking)
    .select("id")
    .single();

  if (error || !inserted) {
    console.error("Supabase insert error:", error);
    return { success: false, message: "Something went wrong. Please try again.", values };
  }

  // Send emails after the response is sent so the function doesn't get
  // frozen mid-request on serverless platforms. The guest email's outcome is
  // stored on the booking so a failed send shows up in the admin dashboard.
  after(async () => {
    const [guest] = await Promise.all([
      sendGuestReceivedEmail(booking),
      sendInstructorNotification(booking),
    ]);
    await recordGuestEmail(inserted.id, "received", guest);
  });

  return { success: true, message: SUCCESS_MESSAGE };
}
