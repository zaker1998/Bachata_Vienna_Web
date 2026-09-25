// Display helpers for the admin dashboard. Pure, so they're unit-testable.

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

/** wa.me link for a stored number, or null if it can't be dialled internationally. */
export function whatsappLink(number: string): string | null {
  const trimmed = number.trim();
  // wa.me needs the full international number; a leading "00" is the same as "+".
  const digits = trimmed.replace(/^00/, "").replace(/\D/g, "");
  const international = trimmed.startsWith("+") || trimmed.startsWith("00");
  if (!international || digits.length < 7) return null;
  return `https://wa.me/${digits}`;
}

/** tel: href that keeps a leading "+". */
export function telLink(number: string): string {
  const trimmed = number.trim();
  return `tel:${trimmed.startsWith("+") ? "+" : ""}${trimmed.replace(/\D/g, "")}`;
}
