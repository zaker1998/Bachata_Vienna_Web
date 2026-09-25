"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { sendContactMessage, type ContactResult } from "@/app/contact/actions";
import { cn } from "@/lib/utils";

const initialState: ContactResult = { success: false, message: "" };

const fieldClasses = (hasError: boolean) =>
  cn(
    "w-full rounded-lg border bg-white px-4 py-2.5 text-base sm:text-sm",
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

export function ContactForm() {
  // Remounting via `key` resets useActionState + native fields after success.
  const [formKey, setFormKey] = useState(0);

  return <ContactFormInner key={formKey} onReset={() => setFormKey((k) => k + 1)} />;
}

function ContactFormInner({ onReset }: { onReset: () => void }) {
  const [state, formAction, pending] = useActionState(
    async (_prev: ContactResult, formData: FormData) => sendContactMessage(formData),
    initialState
  );

  const errors = state.fieldErrors ?? {};
  // Echoed back by the action: React resets the form after submitting, so
  // these refill it when there was an error.
  const values = state.values ?? {};

  if (state.success) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <CheckCircle className="h-10 w-10 text-emerald-600" />
        <p className="text-lg font-semibold text-emerald-800">{state.message}</p>
        <p className="text-sm text-emerald-700">
          I usually respond within 24 hours.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="text-sm font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.message && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          {state.message}
        </div>
      )}

      <div aria-hidden="true" className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <fieldset disabled={pending} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="name" className="text-sm font-medium">Name</label>
            <input
              id="name"
              name="name"
              defaultValue={values.name}
              type="text"
              required
              autoComplete="name"
              placeholder="Your name"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? "name-error" : undefined}
              className={fieldClasses(!!errors.name)}
            />
            <FieldError id="name-error" message={errors.name} />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium">Email</label>
            <input
              id="email"
              name="email"
              defaultValue={values.email}
              type="email"
              required
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              className={fieldClasses(!!errors.email)}
            />
            <FieldError id="email-error" message={errors.email} />
          </div>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="message" className="text-sm font-medium">Message</label>
          <textarea
            id="message"
            name="message"
            defaultValue={values.message}
            required
            rows={5}
            placeholder="How can I help you?"
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "message-error" : undefined}
            className={cn(
              fieldClasses(!!errors.message),
              "resize-none"
            )}
          />
          <FieldError id="message-error" message={errors.message} />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-white shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 disabled:opacity-70 cursor-pointer"
        >
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending…
            </>
          ) : (
            "Send Message"
          )}
        </button>
        <p className="text-center text-xs text-muted-foreground">
          We only use your details to reply to you. See our{" "}
          <Link href="/datenschutz" className="underline underline-offset-2 hover:text-foreground">
            privacy policy
          </Link>
          .
        </p>
      </fieldset>
    </form>
  );
}
