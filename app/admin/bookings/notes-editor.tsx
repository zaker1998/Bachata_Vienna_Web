"use client";

import { useState, useTransition } from "react";
import { Loader2, StickyNote } from "lucide-react";
import { updateBookingNotes } from "./actions";
import { cn } from "@/lib/utils";

const MAX = 2000;

/** Private admin notes on a booking, e.g. "agreed 18:00 on WhatsApp". */
export function NotesEditor({ id, name, initial }: { id: string; name: string; initial: string }) {
  const [saved, setSaved] = useState(initial);
  const [draft, setDraft] = useState(initial);
  const [open, setOpen] = useState(initial !== "");
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const dirty = draft.trim() !== saved.trim();
  const fieldId = `notes-${id}`;

  function save() {
    setNotice(null);
    startTransition(async () => {
      const result = await updateBookingNotes(id, draft).catch(() => ({
        ok: false as const,
        error: "Network error. Please try again.",
      }));
      if (result.ok) {
        setSaved(draft.trim());
        setDraft(draft.trim());
        setNotice({ tone: "ok", text: "Notes saved" });
      } else {
        setNotice({ tone: "error", text: result.error });
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center gap-1.5 self-start rounded-md px-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <StickyNote className="h-4 w-4" aria-hidden />
        Add note
      </button>
    );
  }

  return (
    <div className="space-y-2">
      <label htmlFor={fieldId} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <StickyNote className="h-3.5 w-3.5" aria-hidden />
        Notes <span className="sr-only">for {name}</span>
        <span className="font-normal">(only visible to you)</span>
      </label>
      <textarea
        id={fieldId}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && dirty) save();
        }}
        maxLength={MAX}
        rows={2}
        autoFocus={initial === ""}
        placeholder="e.g. Agreed on 18:00 via WhatsApp, prefers English"
        className="w-full resize-y rounded-lg border border-border bg-white px-3 py-2 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
      />
      <div className="flex items-center justify-between gap-3">
        <p
          role="status"
          aria-live="polite"
          className={cn(
            "text-xs font-medium",
            notice?.tone === "error" ? "text-rose-700" : "text-emerald-700"
          )}
        >
          {notice?.text}
        </p>
        {dirty && (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => {
                setDraft(saved);
                setNotice(null);
                if (saved === "") setOpen(false);
              }}
              className="min-h-11 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground sm:min-h-9"
            >
              Discard
            </button>
            <button
              type="button"
              onClick={save}
              disabled={pending}
              className="inline-flex min-h-11 items-center gap-1.5 rounded-md bg-foreground px-3 text-sm font-semibold text-background hover:bg-foreground/85 disabled:cursor-wait sm:min-h-9"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
              Save note
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
