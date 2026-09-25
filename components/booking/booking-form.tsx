"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState } from "react";
import { createBooking, type BookingResult } from "@/app/book/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle, Info, Loader2 } from "lucide-react";

// `attempt` changes on every submit; it keys the <form> so it remounts with
// the echoed-back values (see `values` below).
type BookingState = BookingResult & { attempt: number };
const initialState: BookingState = { success: false, message: "", attempt: 0 };

function SubmitButton({ pending }: { pending: boolean }) {
  return (
    <Button type="submit" size="lg" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Submitting…
        </>
      ) : (
        "Book My Class"
      )}
    </Button>
  );
}

const fieldClasses = (hasError: boolean) =>
  cn(
    "w-full h-11 rounded-lg border bg-white px-4 text-base sm:text-sm",
    "placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2",
    hasError
      ? "border-rose-300 focus:border-rose-400 focus:ring-rose-200"
      : "border-border focus:border-primary focus:ring-primary/20"
  );

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-xs font-medium text-rose-600">
      {message}
    </p>
  );
}

const TIME_SLOTS = Array.from({ length: 15 }, (_, i) =>
  String(i + 8).padStart(2, "0") + ":00"
);

function TimeSelect({
  id,
  name,
  hasError,
  defaultValue = "",
}: {
  id: string;
  name: string;
  hasError: boolean;
  defaultValue?: string;
}) {
  return (
    <select
      id={id}
      name={name}
      required
      defaultValue={defaultValue}
      aria-invalid={hasError}
      aria-describedby={hasError ? `${id}-error` : undefined}
      className={fieldClasses(hasError)}
    >
      <option value="" disabled>
        Select time
      </option>
      {TIME_SLOTS.map((t) => (
        <option key={t} value={t}>
          {t}
        </option>
      ))}
    </select>
  );
}

export function BookingForm() {
  // `formKey` lets us remount the form (resetting useActionState + native
  // form fields) without a full page reload after a successful submission.
  const [formKey, setFormKey] = useState(0);

  return <BookingFormInner key={formKey} onReset={() => setFormKey((k) => k + 1)} />;
}

function BookingFormInner({ onReset }: { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (prev: BookingState, formData: FormData): Promise<BookingState> => ({
      ...(await createBooking(formData)),
      attempt: prev.attempt + 1,
    }),
    initialState
  );

  const errors = state.fieldErrors ?? {};
  // Echoed back by the action: React resets the form after submitting, so
  // these refill it when there was an error. The form is remounted (keyed by
  // `attempt`) because a reset ignores React's `defaultValue` on <select>s.
  const values = state.values ?? {};
  const formRef = useRef<HTMLFormElement>(null);

  // Move focus to the first invalid field so keyboard and screen-reader users
  // land where the problem is.
  useEffect(() => {
    if (!state.fieldErrors) return;
    formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
  }, [state]);
  const [classType, setClassType] = useState(values.class_type ?? "");

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-600" />
        <p className="text-lg font-semibold text-emerald-800">{state.message}</p>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
        >
          Book another class
        </button>
      </div>
    );
  }

  // Vienna-local "today" for the date pickers' min — toISOString() is UTC and
  // would allow "yesterday" in the early Vienna morning.
  const todayIso = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Vienna" }).format(
    new Date()
  );

  return (
    <form
      key={state.attempt}
      ref={formRef}
      action={formAction}
      className="space-y-5"
      noValidate
    >
      {state.message && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}

      {/* Honeypot — invisible to humans, tempting to bots */}
      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <fieldset disabled={pending} className="space-y-5">
        <div className="space-y-1.5">
          <label htmlFor="user_name" className="text-sm font-medium">
            Full Name
          </label>
          <input
            id="user_name"
            name="user_name"
            defaultValue={values.user_name}
            type="text"
            required
            autoComplete="name"
            placeholder="Maria Schmidt"
            aria-invalid={!!errors.user_name}
            aria-describedby={errors.user_name ? "user_name-error" : undefined}
            className={fieldClasses(!!errors.user_name)}
          />
          <FieldError id="user_name-error" message={errors.user_name} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="user_email" className="text-sm font-medium">
            Email
          </label>
          <input
            id="user_email"
            name="user_email"
            defaultValue={values.user_email}
            type="email"
            required
            autoComplete="email"
            placeholder="maria@example.com"
            aria-invalid={!!errors.user_email}
            aria-describedby={errors.user_email ? "user_email-error" : undefined}
            className={fieldClasses(!!errors.user_email)}
          />
          <FieldError id="user_email-error" message={errors.user_email} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="whatsapp_number" className="text-sm font-medium">
            WhatsApp Number
          </label>
          <input
            id="whatsapp_number"
            name="whatsapp_number"
            defaultValue={values.whatsapp_number}
            type="tel"
            required
            autoComplete="tel"
            placeholder="+43 660 123 4567"
            aria-invalid={!!errors.whatsapp_number}
            aria-describedby={cn("whatsapp_number-hint", errors.whatsapp_number && "whatsapp_number-error")}
            className={fieldClasses(!!errors.whatsapp_number)}
          />
          <p id="whatsapp_number-hint" className="text-xs text-muted-foreground">
            With country code, e.g. +43 — Austrian numbers starting with 0 work too.
          </p>
          <FieldError id="whatsapp_number-error" message={errors.whatsapp_number} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="class_type" className="text-sm font-medium">
            Class Type
          </label>
          <select
            id="class_type"
            name="class_type"
            required
            value={classType}
            onChange={(e) => setClassType(e.target.value)}
            aria-invalid={!!errors.class_type}
            aria-describedby={errors.class_type ? "class_type-error" : undefined}
            className={fieldClasses(!!errors.class_type)}
          >
            <option value="" disabled>
              Select a class type
            </option>
            <option value="group">Group Class</option>
            <option value="private">Private Lesson</option>
          </select>
          <FieldError id="class_type-error" message={errors.class_type} />
          {classType === "group" && (
            <p className="flex gap-2 rounded-lg bg-secondary/60 px-3 py-2 text-xs text-secondary-foreground">
              <Info className="mt-px h-3.5 w-3.5 shrink-0" aria-hidden />
              The group schedule isn&apos;t fixed yet — pick the days and times that suit you
              and we&apos;ll let you know as soon as a group starts.
            </p>
          )}
        </div>

        {/* Primary slot */}
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Preferred Date &amp; Time
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="preferred_date" className="text-sm font-medium">
                Date
              </label>
              <input
                id="preferred_date"
                name="preferred_date"
                defaultValue={values.preferred_date}
                type="date"
                required
                min={todayIso}
                aria-invalid={!!errors.preferred_date}
                aria-describedby={errors.preferred_date ? "preferred_date-error" : undefined}
                className={fieldClasses(!!errors.preferred_date)}
              />
              <FieldError id="preferred_date-error" message={errors.preferred_date} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="preferred_time" className="text-sm font-medium">
                Time
              </label>
              <TimeSelect
                id="preferred_time"
                name="preferred_time"
                hasError={!!errors.preferred_time}
                defaultValue={values.preferred_time}
              />
              <FieldError id="preferred_time-error" message={errors.preferred_time} />
            </div>
          </div>
        </div>

        {/* Secondary slot */}
        <div className="space-y-3 rounded-lg border border-border bg-muted/20 px-4 py-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Secondary Preferred Date &amp; Time{" "}
            <span className="font-normal normal-case tracking-normal text-muted-foreground/70">
              — if first isn&apos;t available
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="secondary_date" className="text-sm font-medium">
                Date
              </label>
              <input
                id="secondary_date"
                name="secondary_date"
                defaultValue={values.secondary_date}
                type="date"
                required
                min={todayIso}
                aria-invalid={!!errors.secondary_date}
                aria-describedby={errors.secondary_date ? "secondary_date-error" : undefined}
                className={fieldClasses(!!errors.secondary_date)}
              />
              <FieldError id="secondary_date-error" message={errors.secondary_date} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="secondary_time" className="text-sm font-medium">
                Time
              </label>
              <TimeSelect
                id="secondary_time"
                name="secondary_time"
                hasError={!!errors.secondary_time}
                defaultValue={values.secondary_time}
              />
              <FieldError id="secondary_time-error" message={errors.secondary_time} />
            </div>
          </div>
        </div>

        <SubmitButton pending={pending} />
        <p className="text-center text-xs text-muted-foreground">
          We only use your details to arrange your class. See our{" "}
          <Link href="/datenschutz" className="underline underline-offset-2 hover:text-foreground">
            privacy policy
          </Link>
          .
        </p>
      </fieldset>
    </form>
  );
}
