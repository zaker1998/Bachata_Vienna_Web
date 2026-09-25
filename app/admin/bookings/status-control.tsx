"use client";

import { useState, useTransition } from "react";
import { Check, Clock, Loader2, Mail, X } from "lucide-react";
import { updateBookingStatus } from "./actions";
import { cn } from "@/lib/utils";
import type { BookingRow } from "@/lib/types";

type BookingStatus = BookingRow["status"];

const OPTIONS: {
  value: BookingStatus;
  /** Action label ("Confirm"), and the state label once selected ("Confirmed"). */
  label: string;
  doneLabel: string;
  icon: typeof Check;
  active: string;
}[] = [
  {
    value: "pending",
    label: "Pending",
    doneLabel: "Pending",
    icon: Clock,
    active: "border-amber-300 bg-amber-100 text-amber-900",
  },
  {
    value: "confirmed",
    label: "Confirm",
    doneLabel: "Confirmed",
    icon: Check,
    active: "border-emerald-300 bg-emerald-100 text-emerald-900",
  },
  {
    value: "cancelled",
    label: "Cancel",
    doneLabel: "Cancelled",
    icon: X,
    active: "border-rose-300 bg-rose-100 text-rose-900",
  },
];

// Confirming or cancelling emails the guest, so those two ask first — an
// accidental tap on a phone shouldn't send an email.
const EMAIL_PROMPT: Partial<Record<BookingStatus, string>> = {
  confirmed: "Confirm and email the guest?",
  cancelled: "Cancel and email the guest?",
};

export function StatusControl({
  id,
  name,
  current,
}: {
  id: string;
  name: string;
  current: BookingStatus;
}) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState<BookingStatus>(current);
  const [asking, setAsking] = useState<BookingStatus | null>(null);
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(
    null
  );

  function save(next: BookingStatus) {
    const previous = value;
    setAsking(null);
    setNotice(null);
    setValue(next); // Optimistic update.

    startTransition(async () => {
      const result = await updateBookingStatus(id, next).catch(() => ({
        ok: false as const,
        error: "Network error. Please try again.",
      }));
      if (!result.ok) {
        setValue(previous);
        setNotice({ tone: "error", text: result.error });
        return;
      }
      setNotice({
        tone: "ok",
        // The email goes out after the response, so don't claim it was delivered.
        text: result.emailed ? `Saved · notifying ${name} by email` : "Saved",
      });
    });
  }

  function choose(next: BookingStatus) {
    if (next === value || pending) return;
    if (EMAIL_PROMPT[next]) {
      setNotice(null);
      setAsking(next);
    } else {
      save(next);
    }
  }

  return (
    <div className="space-y-2">
      {asking ? (
        <div
          className="flex flex-col gap-2 rounded-lg border border-border bg-muted/50 p-3 sm:flex-row sm:items-center"
          role="group"
          aria-label={`Confirm status change for ${name}`}
        >
          <p className="flex flex-1 items-center gap-2 text-sm font-medium">
            <Mail className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
            {EMAIL_PROMPT[asking]}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              // Focus the safe choice so a stray Enter doesn't email the guest.
              autoFocus
              onClick={() => setAsking(null)}
              className="min-h-11 rounded-lg border border-border bg-white px-4 text-sm font-medium hover:bg-muted"
            >
              Back
            </button>
            <button
              type="button"
              onClick={() => save(asking)}
              className={cn(
                "min-h-11 rounded-lg px-4 text-sm font-semibold text-white",
                asking === "cancelled"
                  ? "bg-rose-600 hover:bg-rose-700"
                  : "bg-emerald-600 hover:bg-emerald-700"
              )}
            >
              {asking === "cancelled" ? "Yes, cancel" : "Yes, confirm"}
            </button>
          </div>
        </div>
      ) : (
        <div
          role="group"
          aria-label={`Booking status for ${name}`}
          className="grid grid-cols-3 gap-2"
        >
          {OPTIONS.map(({ value: option, label, doneLabel, icon: Icon, active }) => {
            const selected = value === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={selected}
                disabled={pending}
                onClick={() => choose(option)}
                className={cn(
                  "inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg border px-1 text-sm font-medium transition-colors",
                  "disabled:cursor-wait",
                  selected
                    ? active
                    : "border-border bg-white text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {pending && selected ? (
                  <Loader2 className="hidden h-4 w-4 shrink-0 animate-spin min-[380px]:block" aria-hidden />
                ) : (
                  <Icon className="hidden h-4 w-4 shrink-0 min-[380px]:block" aria-hidden />
                )}
                {selected ? doneLabel : label}
              </button>
            );
          })}
        </div>
      )}

      <p
        role="status"
        aria-live="polite"
        className={cn(
          "min-h-4 text-xs font-medium",
          notice?.tone === "error" ? "text-rose-700" : "text-emerald-700"
        )}
      >
        {notice?.text}
      </p>
    </div>
  );
}

