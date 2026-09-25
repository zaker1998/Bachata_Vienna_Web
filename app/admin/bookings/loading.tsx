export default function AdminBookingsLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-10" aria-busy="true">
      <span className="sr-only" role="status">
        Loading bookings…
      </span>
      <div className="mb-6">
        <div className="h-8 w-36 animate-pulse rounded bg-muted" />
        <div className="mt-2 h-4 w-56 animate-pulse rounded bg-muted/60" />
      </div>
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
      <div className="mb-6 h-11 animate-pulse rounded-lg bg-muted/70" />
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="space-y-4 rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5"
          >
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            <div className="h-16 animate-pulse rounded-lg bg-muted/60" />
            <div className="grid grid-cols-3 gap-2">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="h-11 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
            <div className="h-11 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    </div>
  );
}
