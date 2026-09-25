-- Admin notes and guest-email delivery tracking.
--
-- email_*          : outcome of the most recent email sent to the guest, so the
--                    admin dashboard can flag failed sends instead of them only
--                    appearing in server logs.
-- emailed_statuses : statuses the guest has already been emailed about, so
--                    toggling confirmed → pending → confirmed doesn't send the
--                    same email twice.

alter table public.bookings
  add column if not exists notes text,
  add column if not exists email_status text
    check (email_status in ('sent', 'failed')),
  add column if not exists email_kind text
    check (email_kind in ('received', 'confirmed', 'cancelled')),
  add column if not exists email_error text,
  add column if not exists email_at timestamptz,
  add column if not exists emailed_statuses text[] not null default '{}';

alter table public.bookings
  drop constraint if exists bookings_notes_length;
alter table public.bookings
  add constraint bookings_notes_length check (char_length(notes) <= 2000);
