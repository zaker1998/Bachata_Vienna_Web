import type { BookingRow } from "@/lib/types";
import { PUBLIC_CONTACT_EMAIL } from "@/lib/constants";
import { escapeHtml } from "@/lib/utils";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function formatDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("de-AT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatSlot(date: string | null, time: string | null): string {
  if (!date) return "—";
  const day = formatDate(date);
  return time ? `${day}, ${time}` : day;
}

export type StatusEmailKind = "confirmed" | "cancelled";

const copy: Record<
  StatusEmailKind,
  {
    subject: string;
    headline: string;
    body: string;
    badgeBg: string;
    badgeFg: string;
    label: string;
    ctaHref: string;
    ctaLabel: string;
  }
> = {
  confirmed: {
    subject: "Your Bachata Vienna booking is confirmed 🎉",
    headline: "You&#39;re confirmed! 🎉",
    body: "your class is confirmed. We'll be in touch on WhatsApp to finalize the exact time.",
    badgeBg: "#d1fae5",
    badgeFg: "#065f46",
    label: "Confirmed",
    ctaHref: `${siteUrl}/videos`,
    ctaLabel: "Browse Class Videos",
  },
  cancelled: {
    subject: "Your Bachata Vienna booking was cancelled",
    headline: "Booking cancelled",
    body: "your booking request has been cancelled. If this was unexpected, just reply to this email and we'll help you find another slot.",
    badgeBg: "#ffe4e6",
    badgeFg: "#9f1239",
    label: "Cancelled",
    ctaHref: `${siteUrl}/book`,
    ctaLabel: "Book Another Class",
  },
};

export function statusUpdateSubject(status: StatusEmailKind): string {
  return copy[status].subject;
}

export function statusUpdateEmailHtml(
  booking: BookingRow,
  status: StatusEmailKind
): string {
  const c = copy[status];
  const safeName = escapeHtml(booking.user_name);
  const safeClassType = escapeHtml(booking.class_type);
  const safeSlot1 = escapeHtml(
    formatSlot(booking.preferred_date, booking.preferred_time)
  );
  const safeSlot2 = escapeHtml(
    formatSlot(booking.secondary_date, booking.secondary_time)
  );

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${c.label} — Bachata Vienna</title>
</head>
<body style="margin:0;padding:0;background:#faf9f6;font-family:Inter,ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#faf9f6;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;border:1px solid #e5e5e5;overflow:hidden;">
          <tr>
            <td style="background:#c2185b;padding:32px 40px;">
              <p style="margin:0;font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.5px;">
                Bachata Vienna
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px;">
              <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#1a1a1a;">
                ${c.headline}
              </h1>
              <p style="margin:0 0 28px;font-size:15px;color:#737373;line-height:1.6;">
                Hi ${safeName}, ${escapeHtml(c.body)}
              </p>
              <table width="100%" cellpadding="0" cellspacing="0"
                style="background:#faf9f6;border-radius:10px;border:1px solid #e5e5e5;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#737373;width:40%;">Class type</td>
                        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;text-transform:capitalize;">${safeClassType}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#737373;">1st choice</td>
                        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;">${safeSlot1}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#737373;">2nd choice</td>
                        <td style="padding:6px 0;font-size:13px;font-weight:600;color:#1a1a1a;">${safeSlot2}</td>
                      </tr>
                      <tr>
                        <td style="padding:6px 0;font-size:13px;color:#737373;">Status</td>
                        <td style="padding:6px 0;">
                          <span style="display:inline-block;background:${c.badgeBg};color:${c.badgeFg};font-size:12px;font-weight:600;padding:2px 10px;border-radius:999px;">
                            ${c.label}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 28px;font-size:14px;color:#737373;line-height:1.6;">
                Questions? Reply to this email or reach us at
                <a href="mailto:${PUBLIC_CONTACT_EMAIL}" style="color:#c2185b;text-decoration:none;">
                  ${PUBLIC_CONTACT_EMAIL}
                </a>
              </p>
              <a href="${c.ctaHref}"
                style="display:inline-block;background:#c2185b;color:#ffffff;font-size:14px;font-weight:600;padding:12px 28px;border-radius:8px;text-decoration:none;">
                ${c.ctaLabel}
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 40px;border-top:1px solid #e5e5e5;">
              <p style="margin:0;font-size:12px;color:#a3a3a3;">
                © ${new Date().getFullYear()} Bachata Vienna · Vienna, Austria
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function statusUpdateEmailText(
  booking: BookingRow,
  status: StatusEmailKind
): string {
  const c = copy[status];
  return `Hi ${booking.user_name},

Your Bachata Vienna ${booking.class_type} class — ${c.body}

1st choice: ${formatSlot(booking.preferred_date, booking.preferred_time)}
2nd choice: ${formatSlot(booking.secondary_date, booking.secondary_time)}
Status: ${c.label}

— Bachata Vienna
${PUBLIC_CONTACT_EMAIL}`;
}
