// Display helpers for the admin dashboard. Pure, so they're unit-testable.

import type { BookingRow } from "@/lib/types";

const VIENNA = "Europe/Vienna";

/** "2026-09-01" → "Tue, 1 Sep 2026". Dates are calendar days, so format in UTC. */
export function formatDay(iso: string): string {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Relative age of a timestamp, e.g. "3 hours ago", "yesterday". */
export function timeAgo(timestamp: string, now: Date = new Date()): string {
  const diffSec = Math.round((new Date(timestamp).getTime() - now.getTime()) / 1000);
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  const abs = Math.abs(diffSec);
  if (abs < 60) return "just now";
  if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
  if (abs < 86_400) return rtf.format(Math.round(diffSec / 3600), "hour");
  if (abs < 30 * 86_400) return rtf.format(Math.round(diffSec / 86_400), "day");
  return new Date(timestamp).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: VIENNA,
  });
}

/** Absolute submitted time for tooltips, in Vienna time. */
export function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: VIENNA,
  });
}

/**
 * wa.me link for a stored number, or null if it can't be dialled
 * internationally. `text` pre-fills the message.
 */
export function whatsappLink(number: string, text?: string): string | null {
  const trimmed = number.trim();
  // wa.me needs the full international number; a leading "00" is the same as "+".
  const digits = trimmed.replace(/^00/, "").replace(/\D/g, "");
  const international = trimmed.startsWith("+") || trimmed.startsWith("00");
  if (!international || digits.length < 7) return null;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${digits}${query}`;
}

type MessageBooking = Pick<
  BookingRow,
  "user_name" | "class_type" | "status" | "preferred_date" | "preferred_time" | "secondary_date" | "secondary_time"
>;

function slotText(date: string | null, time: string | null): string | null {
  if (!date) return null;
  return time ? `${formatDay(date)} at ${time}` : formatDay(date);
}

/** Ready-to-send WhatsApp message matching the booking's status. */
export function whatsappMessage(b: MessageBooking): string {
  const firstName = b.user_name.trim().split(/\s+/)[0];
  const lesson = b.class_type === "private" ? "private lesson" : "group class";
  const first = slotText(b.preferred_date, b.preferred_time);
  const second = slotText(b.secondary_date, b.secondary_time);

  switch (b.status) {
    case "confirmed":
      return `Hi ${firstName}! Your Bachata ${lesson} is confirmed for ${first}. See you there! 💃🕺`;
    case "cancelled":
      return `Hi ${firstName}, about your Bachata ${lesson} request: unfortunately that slot doesn't work. Which other days and times would suit you?`;
    default:
      return (
        `Hi ${firstName}! Thanks for your Bachata ${lesson} request. ` +
        `Does ${first} work for you` +
        (second ? `, or would you prefer ${second}?` : "?")
      );
  }
}

/**
 * Readable phone number: "+436601234567" → "+43 660 1234567". Only splits
 * after country codes we can be sure of; anything else is shown as stored.
 */
export function formatPhone(number: string): string {
  const m = /^\+(43|49|41)(\d{3})(\d{4,})$/.exec(number.replace(/[\s()-]/g, ""));
  return m ? `+${m[1]} ${m[2]} ${m[3]}` : number;
}

/** tel: href that keeps a leading "+". */
export function telLink(number: string): string {
  const trimmed = number.trim();
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${trimmed.replace(/\D/g, "")}`;
}
