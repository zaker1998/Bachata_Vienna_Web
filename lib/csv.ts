// Minimal RFC 4180 CSV writer for the admin bookings export.

/**
 * Quotes a cell and neutralises spreadsheet formulas.
 *
 * Guest-supplied text starting with = + - @ (or tab/CR) would be run as a
 * formula when the file is opened in Excel/Sheets ("CSV injection"), so it's
 * prefixed with an apostrophe. Phone numbers ("+43 …") get the same prefix,
 * which also stops Excel from mangling them into numbers.
 */
export function csvCell(value: unknown): string {
  if (value === null || value === undefined) return "";
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) || s !== s.trim() ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCsv(header: string[], rows: unknown[][]): string {
  // CRLF line endings per RFC 4180; the BOM makes Excel read it as UTF-8
  // (names like "María" would otherwise come out garbled).
  return "﻿" + [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}
