export interface BookingInsert {
  user_name: string;
  user_email: string;
  whatsapp_number: string;
  class_type: "private" | "group";
  preferred_date: string;  // ISO date YYYY-MM-DD
  preferred_time: string;  // HH:MM, e.g. "14:00"
  secondary_date: string;  // ISO date YYYY-MM-DD
  secondary_time: string;  // HH:MM, e.g. "16:00"
}

/** Which guest email a booking's `email_*` columns describe. */
export type GuestEmailKind = "received" | "confirmed" | "cancelled";

export interface BookingRow extends Omit<BookingInsert, "preferred_time" | "secondary_date" | "secondary_time"> {
  id: string;
  status: "pending" | "confirmed" | "cancelled";
  created_at: string;
  // Nullable for rows that pre-date the dual-slot migration
  preferred_time: string | null;
  secondary_date: string | null;
  secondary_time: string | null;
  // Added by the 20260925 migration — optional so the app keeps working on a
  // database where it hasn't been applied yet.
  notes?: string | null;
  email_status?: "sent" | "failed" | null;
  email_kind?: GuestEmailKind | null;
  email_error?: string | null;
  email_at?: string | null;
  emailed_statuses?: string[] | null;
}
