import { Mail, MessageCircle, Phone, User, Users } from "lucide-react";
import { StatusControl } from "./status-control";
import { EmailStatus } from "./email-status";
import { NotesEditor } from "./notes-editor";
import { cn } from "@/lib/utils";
import {
  formatDay,
  formatPhone,
  formatTimestamp,
  telLink,
  timeAgo,
  whatsappLink,
  whatsappMessage,
} from "@/lib/format";
import { normalizeWhatsApp } from "@/lib/validation";
import type { BookingRow } from "@/lib/types";

const statusAccent: Record<BookingRow["status"], string> = {
  pending: "before:bg-amber-400",
  confirmed: "before:bg-emerald-500",
  cancelled: "before:bg-rose-400",
};

function Slot({
  label,
  date,
  time,
  today,
}: {
  label: string;
  date: string | null;
  time: string | null;
  today: string;
}) {
  if (!date) {
    return (
      <div>
        <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
        <dd className="text-sm text-muted-foreground">—</dd>
      </div>
    );
  }

  const isPast = date < today;
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className={cn("text-sm font-medium", isPast && "text-muted-foreground line-through")}>
        <time dateTime={date}>{formatDay(date)}</time>
        {time && <span className="text-muted-foreground"> · {time}</span>}
        {isPast && <span className="sr-only"> (in the past)</span>}
        {date === today && (
          <span className="ml-1.5 rounded bg-primary/10 px-1.5 py-0.5 text-[11px] font-semibold text-primary">
            Today
          </span>
        )}
      </dd>
    </div>
  );
}

const actionClasses =
  "inline-flex min-h-11 flex-col items-center justify-center gap-0.5 rounded-lg border border-border bg-white px-2 py-1.5 text-xs font-medium transition-colors hover:border-primary/40 hover:text-primary min-[480px]:flex-row min-[480px]:gap-2 min-[480px]:text-sm";

export function BookingCard({ booking: b, today }: { booking: BookingRow; today: string }) {
  // Normalizing here also fixes rows saved before numbers were normalized on
  // submit ("0660 …"), so their WhatsApp button works too.
  const phone = normalizeWhatsApp(b.whatsapp_number);
  const wa = whatsappLink(phone, whatsappMessage(b));
  const TypeIcon = b.class_type === "private" ? User : Users;

  return (
    <li
      className={cn(
        "relative flex flex-col gap-4 overflow-hidden rounded-xl border border-border bg-white p-4 shadow-sm sm:p-5",
        "before:absolute before:inset-y-0 before:left-0 before:w-1",
        statusAccent[b.status]
      )}
    >
      <div className="min-w-0">
        <h2 className="truncate text-base font-semibold">{b.user_name}</h2>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1 capitalize">
            <TypeIcon className="h-3.5 w-3.5" aria-hidden />
            {b.class_type}
          </span>
          <span aria-hidden>·</span>
          <time dateTime={b.created_at} title={formatTimestamp(b.created_at)}>
            <span className="sr-only">Submitted </span>
            {timeAgo(b.created_at)}
          </time>
        </p>
      </div>

      <dl className="grid grid-cols-1 gap-3 rounded-lg bg-muted/50 p-3 min-[400px]:grid-cols-2">
        <Slot label="1st choice" date={b.preferred_date} time={b.preferred_time} today={today} />
        <Slot label="2nd choice" date={b.secondary_date} time={b.secondary_time} today={today} />
      </dl>

      <div className="space-y-1 text-sm">
        <p className="truncate">
          <span className="sr-only">Email: </span>
          <span className="text-muted-foreground">{b.user_email}</span>
        </p>
        <p>
          <span className="sr-only">WhatsApp: </span>
          <span className="text-muted-foreground">{formatPhone(phone)}</span>
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {wa ? (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            className={actionClasses}
            aria-label={`WhatsApp ${b.user_name} with a pre-filled message`}
            title="Opens WhatsApp with a message you can edit before sending"
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>WhatsApp</span>
          </a>
        ) : (
          <span
            className={cn(actionClasses, "cursor-not-allowed opacity-50 hover:border-border hover:text-foreground")}
            title="Number has no country code"
          >
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            <span>WhatsApp</span>
            <span className="sr-only">unavailable: number has no country code</span>
          </span>
        )}
        <a
          href={telLink(phone)}
          className={actionClasses}
          aria-label={`Call ${b.user_name}`}
        >
          <Phone className="h-4 w-4 shrink-0" aria-hidden />
          <span>Call</span>
        </a>
        <a
          href={`mailto:${b.user_email}`}
          className={actionClasses}
          aria-label={`Email ${b.user_name}`}
        >
          <Mail className="h-4 w-4 shrink-0" aria-hidden />
          <span>Email</span>
        </a>
      </div>

      <NotesEditor id={b.id} name={b.user_name} initial={b.notes ?? ""} />

      <div className="space-y-3 border-t border-border pt-4">
        <StatusControl
          id={b.id}
          name={b.user_name}
          current={b.status}
          alreadyEmailed={b.emailed_statuses ?? []}
        />
        <EmailStatus
          id={b.id}
          name={b.user_name}
          status={b.email_status}
          kind={b.email_kind}
          error={b.email_error}
          sentAgo={b.email_at ? timeAgo(b.email_at) : null}
        />
      </div>
    </li>
  );
}
