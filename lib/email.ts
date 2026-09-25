import { Resend } from "resend";
import type { BookingInsert, BookingRow } from "@/lib/types";
import {
  confirmationEmailHtml,
  confirmationEmailText,
} from "@/lib/emails/confirmation";
import {
  notificationEmailHtml,
  notificationEmailText,
} from "@/lib/emails/notification";
import {
  statusUpdateEmailHtml,
  statusUpdateEmailText,
  statusUpdateSubject,
  type StatusEmailKind,
} from "@/lib/emails/status-update";
import { getServerEnv, type ServerEnv } from "@/lib/env";
import { PUBLIC_CONTACT_EMAIL } from "@/lib/constants";

/** Result of one send, so callers can record and surface failures. */
export type EmailOutcome = { ok: true } | { ok: false; error: string };

/**
 * Where guest replies should land.
 *
 * Transactional mail is sent from a no-reply sender, so without an explicit
 * Reply-To a guest hitting "Reply" (which the templates invite them to do)
 * would write to a mailbox nobody reads.
 */
export function guestReplyTo(env: ServerEnv): string {
  return env.REPLY_TO_EMAIL ?? PUBLIC_CONTACT_EMAIL;
}

type SendArgs = Parameters<Resend["emails"]["send"]>[0];

// Resend resolves with `{ data, error }` instead of throwing on API errors —
// check both rejection and the error payload so failures aren't silent.
async function send(label: string, args: SendArgs): Promise<EmailOutcome> {
  const env = getServerEnv();
  try {
    const { error } = await new Resend(env.RESEND_API_KEY).emails.send(args);
    if (!error) return { ok: true };
    console.error(`Failed to send ${label}:`, error);
    return { ok: false, error: error.message || "Email provider rejected the message." };
  } catch (err) {
    console.error(`Failed to send ${label}:`, err);
    return { ok: false, error: err instanceof Error ? err.message : "Email send failed." };
  }
}

/** "We received your request" email to the guest. */
export function sendGuestReceivedEmail(booking: BookingInsert): Promise<EmailOutcome> {
  const env = getServerEnv();
  return send("confirmation email", {
    from: env.RESEND_FROM_EMAIL,
    to: booking.user_email,
    replyTo: guestReplyTo(env),
    subject: "Your Bachata Vienna booking is received 🎉",
    html: confirmationEmailHtml(booking),
    text: confirmationEmailText(booking),
  });
}

/** New-booking alert to the instructor. */
export function sendInstructorNotification(booking: BookingInsert): Promise<EmailOutcome> {
  const env = getServerEnv();
  return send("notification email", {
    from: env.RESEND_FROM_EMAIL,
    to: env.INSTRUCTOR_EMAIL,
    // Lets the instructor answer the guest straight from the notification.
    replyTo: booking.user_email,
    subject: `New booking: ${booking.user_name} — ${booking.class_type}`,
    html: notificationEmailHtml(booking),
    text: notificationEmailText(booking),
  });
}

export async function sendBookingEmails(booking: BookingInsert) {
  const [guest, instructor] = await Promise.all([
    sendGuestReceivedEmail(booking),
    sendInstructorNotification(booking),
  ]);
  return { guest, instructor };
}

export function sendStatusUpdateEmail(
  booking: BookingRow,
  status: StatusEmailKind
): Promise<EmailOutcome> {
  const env = getServerEnv();
  return send(`status-${status} email`, {
    from: env.RESEND_FROM_EMAIL,
    to: booking.user_email,
    replyTo: guestReplyTo(env),
    subject: statusUpdateSubject(status),
    html: statusUpdateEmailHtml(booking, status),
    text: statusUpdateEmailText(booking, status),
  });
}
