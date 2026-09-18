import type { Metadata } from "next";
import { BookingForm } from "@/components/booking/booking-form";
import { Users, User, MessageCircle, Instagram } from "lucide-react";
import {
  INSTAGRAM_HANDLE,
  INSTAGRAM_URL,
  WHATSAPP_NUMBER,
  WHATSAPP_URL,
} from "@/lib/constants";

export const metadata: Metadata = {
  title: "Book a Class",
  description:
    "Reserve your spot in a group class or book a private Bachata lesson in Vienna.",
  alternates: { canonical: "/book" },
  openGraph: {
    title: "Book a Class — Bachata Vienna",
    description:
      "Reserve your spot in a group class or book a private Bachata lesson in Vienna.",
    url: "/book",
    type: "website",
  },
};

const directContacts = [
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: WHATSAPP_NUMBER,
    href: WHATSAPP_URL,
  },
  {
    icon: Instagram,
    label: "Instagram",
    value: `@${INSTAGRAM_HANDLE}`,
    href: INSTAGRAM_URL,
  },
];

export default function BookPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Book a Class
        </h1>
        <p className="mt-2 text-muted-foreground">
          Choose your format, pick a date, and we&apos;ll confirm your spot.
        </p>
      </div>

      <section className="mb-10 rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-lg font-semibold">Book Directly or Ask a Question</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Message me on WhatsApp or Instagram to book a class directly, or if
          you have any questions.
        </p>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {directContacts.map(({ icon: Icon, label, value, href }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 rounded-xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {label}
                </p>
                <p className="mt-0.5 text-sm font-semibold">{value}</p>
              </div>
            </a>
          ))}
        </div>
      </section>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* Form column */}
        <div className="lg:col-span-3">
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm sm:p-8">
            <BookingForm />
          </div>
        </div>

        {/* Info sidebar */}
        <aside className="space-y-6 lg:col-span-2">
          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <Users className="h-5 w-5" />
              <h3 className="font-semibold">Group Class</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>Beginner & intermediate levels</li>
              <li>Schedule will be announced soon.</li>
              <li className="font-medium text-foreground">€15 / class (Student -20%)</li>
            </ul>
          </div>

          <div className="rounded-xl border border-border bg-white p-6 shadow-sm">
            <div className="mb-3 flex items-center gap-2 text-primary">
              <User className="h-5 w-5" />
              <h3 className="font-semibold">Private Lesson</h3>
            </div>
            <ul className="space-y-1.5 text-sm text-muted-foreground">
              <li>1-on-1 or couple session</li>
              <li>Tailored to your level & goals</li>
              <li>Flexible scheduling</li>
              <li className="font-medium text-foreground">€60 / hour</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
