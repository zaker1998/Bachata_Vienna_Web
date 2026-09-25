import Link from "next/link";
import { AlertTriangle, ArrowDownUp, Download, Search, X } from "lucide-react";
import { createAdminClient } from "@/lib/supabase-admin";
import { cn } from "@/lib/utils";
import { todayInVienna } from "@/lib/validation";
import { BookingCard } from "./booking-card";
import type { BookingRow } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Admin — Bookings",
};

async function getBookings(): Promise<BookingRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

const STATUS_FILTERS = ["all", "pending", "confirmed", "cancelled"] as const;
type StatusFilter = (typeof STATUS_FILTERS)[number];

const SORTS = {
  new: "Newest first",
  date: "Class date",
} as const;
type Sort = keyof typeof SORTS;

const filterStyles: Record<StatusFilter, { active: string; dot: string }> = {
  all: { active: "border-primary bg-primary text-white", dot: "bg-primary" },
  pending: { active: "border-amber-400 bg-amber-100 text-amber-900", dot: "bg-amber-400" },
  confirmed: {
    active: "border-emerald-400 bg-emerald-100 text-emerald-900",
    dot: "bg-emerald-500",
  },
  cancelled: { active: "border-rose-300 bg-rose-100 text-rose-900", dot: "bg-rose-400" },
};

function hrefFor(params: { status?: StatusFilter; q?: string; sort?: Sort }) {
  const sp = new URLSearchParams();
  if (params.status && params.status !== "all") sp.set("status", params.status);
  if (params.q) sp.set("q", params.q);
  if (params.sort && params.sort !== "new") sp.set("sort", params.sort);
  const qs = sp.toString();
  return qs ? `/admin/bookings?${qs}` : "/admin/bookings";
}

function matches(b: BookingRow, q: string) {
  const needle = q.toLowerCase();
  return [b.user_name, b.user_email, b.whatsapp_number, b.notes].some((f) =>
    f?.toLowerCase().includes(needle)
  );
}

// Upcoming classes soonest first, then past ones most recent first.
function byClassDate(today: string) {
  return (a: BookingRow, b: BookingRow) => {
    const aPast = a.preferred_date < today;
    const bPast = b.preferred_date < today;
    if (aPast !== bPast) return aPast ? 1 : -1;
    const key = (x: BookingRow) => `${x.preferred_date} ${x.preferred_time ?? ""}`;
    return aPast ? key(b).localeCompare(key(a)) : key(a).localeCompare(key(b));
  };
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; sort?: string }>;
}) {
  const allBookings = await getBookings();
  const params = await searchParams;
  const today = todayInVienna();

  const filter: StatusFilter = STATUS_FILTERS.includes(params.status as StatusFilter)
    ? (params.status as StatusFilter)
    : "all";
  const sort: Sort = params.sort === "date" ? "date" : "new";
  const q = params.q?.trim().slice(0, 100) ?? "";

  const searched = q ? allBookings.filter((b) => matches(b, q)) : allBookings;
  const bookings = searched.filter((b) => filter === "all" || b.status === filter);
  if (sort === "date") bookings.sort(byClassDate(today));

  const countFor = (f: StatusFilter) =>
    f === "all" ? searched.length : searched.filter((b) => b.status === f).length;
  const pendingCount = allBookings.filter((b) => b.status === "pending").length;
  const upcomingConfirmed = allBookings.filter(
    (b) => b.status === "confirmed" && b.preferred_date >= today
  ).length;

  const failedEmails = allBookings.filter((b) => b.email_status === "failed").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bookings</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {pendingCount > 0 ? (
              <>
                <strong className="font-semibold text-foreground">
                  {pendingCount} waiting for a reply
                </strong>{" "}
                · {upcomingConfirmed} upcoming confirmed
              </>
            ) : (
              <>All caught up · {upcomingConfirmed} upcoming confirmed</>
            )}
          </p>
          {failedEmails > 0 && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 text-xs font-medium text-rose-800">
              <AlertTriangle className="h-3.5 w-3.5" aria-hidden />
              {failedEmails} guest email{failedEmails === 1 ? "" : "s"} failed to send — see the
              highlighted bookings
            </p>
          )}
        </div>
        {allBookings.length > 0 && (
          <a
            href="/admin/bookings/export"
            download
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border border-border bg-white px-3 text-sm font-medium hover:border-foreground/30"
          >
            <Download className="h-4 w-4" aria-hidden />
            <span>
              Export<span className="hidden sm:inline"> CSV</span>
            </span>
          </a>
        )}
      </header>

      <nav aria-label="Filter by status" className="mb-4">
        <ul className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STATUS_FILTERS.map((f) => {
            const active = filter === f;
            return (
              <li key={f}>
                <Link
                  href={hrefFor({ status: f, q, sort })}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex min-h-14 items-center justify-between gap-2 rounded-xl border px-4 py-2 transition-colors",
                    active
                      ? filterStyles[f].active
                      : "border-border bg-white hover:border-foreground/30"
                  )}
                >
                  <span className="flex items-center gap-2 text-sm font-medium capitalize">
                    {!active && (
                      <span
                        className={cn("h-2 w-2 rounded-full", filterStyles[f].dot)}
                        aria-hidden
                      />
                    )}
                    {f}
                  </span>
                  <span className="text-xl font-bold tabular-nums">{countFor(f)}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mb-6 flex flex-col gap-2 sm:flex-row">
        <form role="search" action="/admin/bookings" className="relative flex-1">
          {filter !== "all" && <input type="hidden" name="status" value={filter} />}
          {sort !== "new" && <input type="hidden" name="sort" value={sort} />}
          <label htmlFor="booking-search" className="sr-only">
            Search bookings by name, email, phone or notes
          </label>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            id="booking-search"
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search bookings"
            enterKeyHint="search"
            className="h-11 w-full rounded-lg border border-border bg-white pl-9 pr-10 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
          />
          {q && (
            <Link
              href={hrefFor({ status: filter, sort })}
              aria-label="Clear search"
              className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="h-4 w-4" aria-hidden />
            </Link>
          )}
        </form>

        <Link
          href={hrefFor({ status: filter, q, sort: sort === "new" ? "date" : "new" })}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-border bg-white px-4 text-sm font-medium hover:border-foreground/30"
        >
          <ArrowDownUp className="h-4 w-4" aria-hidden />
          <span>
            <span className="text-muted-foreground">Sort: </span>
            {SORTS[sort]}
          </span>
        </Link>
      </div>

      {bookings.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-4 py-16 text-center text-muted-foreground">
          {q
            ? `No bookings match “${q}”.`
            : filter === "all"
              ? "No bookings yet."
              : `No ${filter} bookings.`}
        </div>
      ) : (
        <>
          <p className="sr-only" role="status">
            Showing {bookings.length} booking{bookings.length === 1 ? "" : "s"}
          </p>
          <ul className="grid gap-4 lg:grid-cols-2">
            {bookings.map((b) => (
              <BookingCard key={b.id} booking={b} today={today} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
