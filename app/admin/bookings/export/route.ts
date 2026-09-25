import { NextResponse } from "next/server";
import { assertAdmin } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase-admin";
import { toCsv } from "@/lib/csv";
import { todayInVienna } from "@/lib/validation";
import type { BookingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

const viennaTime = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Europe/Vienna",
  dateStyle: "short",
  timeStyle: "short",
});

const COLUMNS:[header: string, value: (b: BookingRow) => unknown][] = [
  // "2026-09-25 17:39" in Vienna time — sortable, and Excel parses it as a date.
  ["Submitted (Vienna)", (b) => viennaTime.format(new Date(b.created_at))],
  ["Status", (b) => b.status],
  ["Name", (b) => b.user_name],
  ["Email", (b) => b.user_email],
  ["WhatsApp", (b) => b.whatsapp_number],
  ["Class", (b) => b.class_type],
  ["1st date", (b) => b.preferred_date],
  ["1st time", (b) => b.preferred_time],
  ["2nd date", (b) => b.secondary_date],
  ["2nd time", (b) => b.secondary_time],
  ["Notes", (b) => b.notes],
  ["Last guest email", (b) => (b.email_status ? `${b.email_kind}: ${b.email_status}` : "")],
];

export async function GET() {
  // The middleware already guards /admin/*; checked again here as defense in
  // depth, like the admin Server Actions.
  try {
    await assertAdmin();
  } catch {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { data, error } = await createAdminClient()
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Bookings export failed:", error);
    return new NextResponse("Couldn't load bookings.", { status: 500 });
  }

  const rows = (data as BookingRow[]).map((b) => COLUMNS.map(([, get]) => get(b)));
  const csv = toCsv(COLUMNS.map(([h]) => h), rows);

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-${todayInVienna()}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
