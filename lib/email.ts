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

function logResendResult(
  label: string,
  result: PromiseSettledResult<{ error: unknown }>
) {
  if (result.status === "rejected") {
    console.error(`Failed to send ${label}:`, result.reason);
  } else if (result.value.error) {
    console.error(`Failed to send ${label}:`, result.value.error);
  }
}

export async function sendBookingEmails(booking: BookingInsert) {
  const env = getServerEnv();
  const resend = new Resend(env.RESEND_API_KEY);
  const from = env.RESEND_FROM_EMAIL;
  const replyTo = guestReplyTo(env);

  const [confirmation, notification] = await Promise.allSettled([
    resend.emails.send({
      from,
      to: booking.user_email,
      replyTo,
      subject: "Your Bachata Vienna booking is received 🎉",
      html: confirmationEmailHtml(booking),
      text: confirmationEmailText(booking),
    }),
    resend.emails.send({
      from,
      to: env.INSTRUCTOR_EMAIL,
      // Lets the instructor answer the guest straight from the notification.
      replyTo: booking.user_email,
      subject: `New booking: ${booking.user_name} — ${booking.class_type}`,
      html: notificationEmailHtml(booking),
      text: notificationEmailText(booking),
    }),
  ]);

  // Resend resolves with `{ data, error }` instead of throwing on API errors —
  // check both rejection and the error payload so failures aren't silent.
  logResendResult("confirmation email", confirmation);
  logResendResult("notification email", notification);
}

export async function sendStatusUpdateEmail(
  booking: BookingRow,
  status: StatusEmailKind
) {
  const env = getServerEnv();
  const resend = new Resend(env.RESEND_API_KEY);

  const result = await resend.emails.send({
    from: env.RESEND_FROM_EMAIL,
    to: booking.user_email,
    replyTo: guestReplyTo(env),
    subject: statusUpdateSubject(status),
    html: statusUpdateEmailHtml(booking, status),
    text: statusUpdateEmailText(booking, status),
  });

  if (result.error) {
    console.error(`Failed to send status-${status} email:`, result.error);
  }
}
