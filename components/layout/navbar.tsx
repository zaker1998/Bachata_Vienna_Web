"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ExternalLink, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/videos", label: "Videos" },
  { href: "/book", label: "Book Class" },
  { href: "/contact", label: "Contact" },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen]);

  if (pathname.startsWith("/admin")) return <AdminHeader />;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold tracking-tight text-primary">
          Bachata Vienna
        </Link>

        {/* Desktop */}
        <ul className="hidden gap-8 md:flex">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    active
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <button
          className="-mr-2 flex h-11 w-11 items-center justify-center rounded-md text-foreground md:hidden"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-nav"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      <div
        id="mobile-nav"
        className={cn(
          "overflow-hidden transition-all duration-300 md:hidden",
          mobileOpen ? "max-h-64" : "max-h-0"
        )}
      >
        <ul className="flex flex-col gap-1 px-4 pb-4">
          {navLinks.map((link) => {
            const active = isActive(pathname, link.href);
            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "block rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </header>
  );
}

function AdminHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md">
      <nav
        aria-label="Admin"
        className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4"
      >
        <Link href="/admin/bookings" className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-primary">Bachata Vienna</span>
          <span className="rounded-full bg-foreground px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-background">
            Admin
          </span>
        </Link>
        <Link
          href="/"
          className="inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          View site
        </Link>
      </nav>
    </header>
  );
}
