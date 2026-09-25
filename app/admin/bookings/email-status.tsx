"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Loader2, MailCheck, RotateCw } from "lucide-react";
import { resendGuestEmail } from "./actions";
import { cn } from "@/lib/utils";
import type { BookingRow } from "@/lib/types";

const KIND_LABEL = {
  received: "“Request received”",
  confirmed: "“Confirmed”",
  cancelled: "“Cancelled”",
} as const;

/**
 * Last guest email for a booking, plus a re-send button. Failed sends are
 * highlighted so they don't go unnoticed in the server logs.
 */
export function EmailStatus({
  id,
  name,
  status,
  kind,
  error,
  sentAgo,
}: {
  id: string;
  name: string;
  status: BookingRow["email_status"];
  kind: BookingRow["email_kind"];
  error: string | null | undefined;
  /** Pre-formatted on the server ("2 hours ago"). */
  sentAgo: string | null;
}) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const [confirming, setConfirming] = useState(false);

  function resend() {
    setConfirming(false);
    setNotice(null);
    startTransition(async () => {
      const result = await resendGuestEmail(id).catch(() => ({
        ok: false as const,
        error: "Network error. Please try again.",
      }));
      setNotice(
        result.ok
          ? { tone: "ok", text: `Email sent to ${name}` }
          : { tone: "error", text: result.error }
      );
    });
  }

  const failed = status === "failed";

  return (
    <div
      className={cn(
        "space-y-2 rounded-lg px-3 py-2 text-xs",
        failed
          ? "border border-rose-200 bg-rose-50 text-rose-900"
          : "bg-muted/50 text-muted-foreground"
      )}
    >
      {/* A failure gets a full-width button on phones; otherwise it stays compact. */}
      <div
        className={cn(
          "flex gap-2",
          failed || confirming
            ? "flex-col sm:flex-row sm:items-center sm:justify-between"
            : "items-center justify-between"
        )}
      >
        <p className="flex items-start gap-1.5">
          {failed ? (
            <AlertTriangle className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          ) : (
            <MailCheck className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
          )}
          <span>
            {status && kind ? (
              <>
                {KIND_LABEL[kind]} email {failed ? <strong>failed</strong> : "sent"}
                {sentAgo && ` · ${sentAgo}`}
                {failed && error && <span className="block opacity-80">{error}</span>}
              </>
            ) : (
              "No email delivery info yet"
            )}
          </span>
        </p>
        {confirming ? (
          <div className="grid shrink-0 grid-cols-2 gap-2 sm:flex">
            <button
              type="button"
              // Focus the safe choice so a stray Enter doesn't email the guest.
              autoFocus
              onClick={() => setConfirming(false)}
              className="min-h-11 rounded-md border border-border bg-white px-3 font-medium text-foreground hover:bg-muted sm:min-h-9"
            >
              Back
            </button>
            <button
              type="button"
              onClick={resend}
              className="min-h-11 rounded-md bg-foreground px-3 font-semibold text-background hover:bg-foreground/85 sm:min-h-9"
            >
              Send to {name.split(/\s+/)[0]}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={pending}
            className={cn(
              "inline-flex min-h-11 shrink-0 sm:min-h-9 items-center justify-center gap-1.5 rounded-md border px-3 font-medium transition-colors disabled:cursor-wait",
              failed
                ? "border-rose-300 bg-white text-rose-800 hover:bg-rose-100"
                : "border-border bg-white text-foreground hover:border-foreground/30"
            )}
          >
            {pending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : (
              <RotateCw className="h-3.5 w-3.5" aria-hidden />
            )}
            Resend email
          </button>
        )}
      </div>
      <p
        role="status"
        aria-live="polite"
        className={cn(
          "font-medium empty:hidden",
          notice?.tone === "error" ? "text-rose-700" : "text-emerald-700"
        )}
      >
        {notice?.text}
      </p>
    </div>
  );
}
