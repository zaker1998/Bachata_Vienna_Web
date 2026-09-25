import { z } from "zod";

// Pure request-validation schemas.
//
// Deliberately free of `"use server"`, Supabase, and Resend imports so the
// rules below can be unit-tested without standing up any of that.

/**
 * Today's date in Vienna as "YYYY-MM-DD".
 *
 * The server may run in UTC, so comparing against server-local midnight would
 * be off by up to two hours — enough to reject a valid same-day booking, or
 * accept yesterday's.
 */
export const todayInVienna = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(new Date());

/** Bookable hours, "08:00" … "22:00". */
export const VALID_TIMES = Array.from(
  { length: 15 },
  (_, i) => String(i + 8).padStart(2, "0") + ":00"
) as [string, ...string[]];

/** Furthest ahead a booking may be requested. */
const MAX_DAYS_AHEAD = 365;

const maxBookingDate = () => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + MAX_DAYS_AHEAD);
  return d.toISOString().slice(0, 10);
};

const dateField = (label: string) =>
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `Please pick a valid ${label}.`)
    .refine(
      (s) => !Number.isNaN(new Date(s + "T00:00:00").getTime()),
      `Please pick a valid ${label}.`
    )
    // ISO dates sort lexicographically, so string comparison is safe here.
    .refine((s) => s >= todayInVienna(), "Date must be today or later.")
    .refine((s) => s <= maxBookingDate(), "That date is too far in the future.");

const timeField = z.enum(VALID_TIMES, { message: "Please pick a valid time." });

/** International format required by wa.me links: "+" and 7–15 digits. */
const E164 = /^\+[1-9]\d{6,14}$/;

/**
 * Brings a typed phone number into "+<country><number>" form so the admin's
 * WhatsApp button works. Most guests are in Vienna, so a national number
 * ("0660 …") is read as Austrian. Anything else without a country code is
 * left as-is and rejected by the E.164 check, rather than guessing a country.
 */
export function normalizeWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const trimmed = raw.trim();
  if (trimmed.startsWith("+")) return `+${digits}`;
  if (digits.startsWith("00")) return `+${digits.slice(2)}`;
  if (digits.startsWith("0")) return `+43${digits.slice(1)}`;
  return digits;
}

export const BOOKING_FIELDS = [
  "user_name",
  "user_email",
  "whatsapp_number",
  "class_type",
  "preferred_date",
  "preferred_time",
  "secondary_date",
  "secondary_time",
] as const;
export type BookingField = (typeof BOOKING_FIELDS)[number];

export const BookingSchema = z
  .object({
    user_name: z
      .string()
      .trim()
      .min(2, "Please enter your full name.")
      .max(80, "Name is too long."),
    user_email: z
      .string()
      .trim()
      .toLowerCase()
      .email("Please enter a valid email.")
      .max(120),
    whatsapp_number: z
      .string()
      .trim()
      .regex(/^\+?[0-9()\-\s]{7,20}$/, "Please enter a valid WhatsApp number.")
      .transform(normalizeWhatsApp)
      .pipe(z.string().regex(E164, "Please include your country code, e.g. +43 660 1234567.")),
    class_type: z.enum(["private", "group"], {
      message: "Please pick a class type.",
    }),
    preferred_date: dateField("date"),
    preferred_time: timeField,
    secondary_date: dateField("date"),
    secondary_time: timeField,
  })
  .refine(
    (d) =>
      !(d.preferred_date === d.secondary_date && d.preferred_time === d.secondary_time),
    {
      message: "Secondary slot must differ from the primary slot.",
      path: ["secondary_date"],
    }
  );

export const CONTACT_FIELDS = ["name", "email", "message"] as const;
export type ContactField = (typeof CONTACT_FIELDS)[number];

export const ContactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name.").max(80),
  email: z.string().trim().toLowerCase().email("Please enter a valid email.").max(120),
  message: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters.")
    .max(4000, "Message is too long."),
});

/**
 * The raw submitted strings, echoed back on errors. React 19 resets a form
 * after its action runs, so without these the guest would have to retype
 * everything after a single validation error.
 */
export function submittedValues<K extends string>(
  formData: FormData,
  fields: readonly K[]
): Partial<Record<K, string>> {
  const out: Partial<Record<K, string>> = {};
  for (const field of fields) {
    const value = formData.get(field);
    if (typeof value === "string") out[field] = value.slice(0, 4000);
  }
  return out;
}

/**
 * Reduces Zod issues to the first message per known field.
 *
 * Replaces the hand-written if-chains that previously had to be kept in sync
 * with the schema by hand in every action.
 */
export function collectFieldErrors<K extends string>(
  issues: readonly { path: readonly PropertyKey[]; message: string }[],
  fields: readonly K[]
): Partial<Record<K, string>> {
  const known = new Set<PropertyKey>(fields);
  const out: Partial<Record<K, string>> = {};
  for (const issue of issues) {
    const field = issue.path[0];
    if (field !== undefined && known.has(field)) {
      out[field as K] ??= issue.message;
    }
  }
  return out;
}
